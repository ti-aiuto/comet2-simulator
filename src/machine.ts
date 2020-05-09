import { MACHINE_INSTRUCTION_NUMBER, WordValue, MemoryAddress, toWordHex } from "./utils";
import { Memory } from "./memory";
import { Register } from "./register";

abstract class MachineInstruction {
  protected memory!: Memory;
  protected register!: Register;

  async abstract evaluate(): Promise<number>;

  setup(memory: Memory, register: Register) {
    this.memory = memory;
    this.register = register;
  }

  private instructionWord(): WordValue {
    return this.memory.getValueAt(this.register.getProgramCounter());
  }

  protected gR1Value(): number {
    return (this.instructionWord() & 0xF0) >> 4;
  }

  protected gR2OrIRValue(): number {
    return this.instructionWord() & 0xF;
  }

  protected addrValue(): number {
    return this.memory.getValueAt(this.register.getProgramCounter() + 1);
  }

  protected addrIRAddedValue(): number {
    let addr = this.addrValue();
    if (this.gR2OrIRValue() !== 0) {
      addr += this.register.getGRAt(this.gR2OrIRValue());
    }
    return addr;
  }

  protected setFlags(value: number) {
    if (value > 0) {
      this.register.setFlags(0, 0, 0);
    } else if (value === 0) {
      this.register.setFlags(0, 0, 1);
    } else {
      this.register.setFlags(0, 1, 0);
    }
  }
}

class AND1 extends MachineInstruction {
  async evaluate(): Promise<number> {
    const result = this.gR1Value() & this.gR2OrIRValue();
    this.register.setGRAt(this.gR1Value(), result);
    this.setFlags(result);
    return 1;
  }
}

class AND2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    const result = this.gR1Value() & this.memory.getValueAt(this.gR2OrIRValue());
    this.register.setGRAt(this.gR1Value(), result);
    this.setFlags(result);
    return 2;
  }
}

class LD1 extends MachineInstruction {
  async evaluate(): Promise<number> {
    const result = this.memory.getValueAt(this.gR2OrIRValue());
    this.register.setGRAt(this.gR1Value(), result);
    this.setFlags(result);
    return 1;
  }
}

class LD2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    const result = this.memory.getValueAt(this.addrIRAddedValue());
    this.register.setGRAt(this.gR1Value(), result);
    this.setFlags(result);
    return 2;
  }
}

class LAD2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    this.register.setGRAt(this.gR1Value(), this.addrIRAddedValue());
    return 2;
  }
}

class ST2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    this.memory.setValueAt(this.addrIRAddedValue(), this.register.getGRAt(this.gR1Value()));
    return 2;
  }
}

class SUBA1 extends MachineInstruction {
  async evaluate(): Promise<number> {
    // TODO: オーバーフロー要考慮
    const result = this.register.getGRAt(this.gR1Value()) - this.register.getGRAt(this.gR2OrIRValue());
    this.register.setGRAt(this.gR1Value(), result);
    this.setFlags(result);
    return 1;
  }
}

class ADDA2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    // TODO: オーバーフロー要考慮
    const result = this.register.getGRAt(this.gR1Value()) + this.memory.getValueAt(this.addrIRAddedValue());
    this.register.setGRAt(this.gR1Value(), result);
    this.setFlags(result);
    return 2;
  }
}

class CPA1 extends MachineInstruction {
  async evaluate(): Promise<number> {
    const result = this.register.getGRAt(this.gR1Value()) - this.register.getGRAt(this.gR2OrIRValue());
    this.setFlags(result);
    return 1;
  }
}

class CPA2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    const result = this.register.getGRAt(this.gR1Value()) - this.memory.getValueAt(this.addrIRAddedValue());
    this.setFlags(result);
    return 2;
  }
}

class JUMP2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    this.register.setProgramCounter(this.addrIRAddedValue());
    return 0;
  }
}

class JZE2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    if (this.register.getZeroFlag() === 1) {
      this.register.setProgramCounter(this.addrIRAddedValue());
      return 0;
    }
    return 2;
  }
}

class JMI2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    if (this.register.getSignFlag() === 1) {
      this.register.setProgramCounter(this.addrIRAddedValue());
      return 0;
    }
    return 2;
  }
}

class JPL2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    if (this.register.getSignFlag() === 0 && this.register.getZeroFlag() === 0) {
      this.register.setProgramCounter(this.addrIRAddedValue());
      return 0;
    }
    return 2;
  }
}

class SVC2 extends MachineInstruction {
  async evaluate(): Promise<number> {
    const instruction = this.memory.getValueAt(this.register.getProgramCounter());
    const typeValue = instruction & 0xF;
    if (typeValue === 2) {
      // 出力
      const dataAddr = this.memory.getValueAt(this.register.getProgramCounter() + 1);
      const lengthAddr = this.memory.getValueAt(this.register.getProgramCounter() + 2);
      const length = this.memory.getValueAt(lengthAddr);
      console.log(`OUT From: #${toWordHex(dataAddr)} Length: ${length}\n---`);
      let result = '';
      for (let i = 0; i < length; i++) {
        result += `#${toWordHex(this.memory.getValueAt(dataAddr))} `;
      }
      console.log(`${result}\n---`);
    }
    return 3;
  }
}

export class Machine {
  constructor(
    private memory: Memory,
    private register: Register,
    private beginAddr: MemoryAddress
  ) {
  }

  async execute(): Promise<void> {
    this.register.setProgramCounter(this.beginAddr);
    while (true) {
      if (this.instructionNumber() === MACHINE_INSTRUCTION_NUMBER.RET[1]) {
        // TODO: SPの実装のときにここも直す
        break;
      }
      await this.executeInstruction();
    }
  }

  private instructionNumber(): number {
    const currentAddress = this.register.getProgramCounter();
    return (this.memory.getValueAt(currentAddress) & 0xFF00) >> 8;
  }

  private async executeInstruction(): Promise<void> {
    const instructionImpl = Machine.MACHINE_INSTRUCTION_IMPLIMENTATION[this.instructionNumber()];
    if (!instructionImpl) {
      throw new Error(`実装が未定義 ${this.instructionNumber()} at ${this.register.getProgramCounter()}`);
    }
    instructionImpl.setup(this.memory, this.register);
    const step = await instructionImpl.evaluate();
    if (step === 0) {
      return;
    }
    this.register.setProgramCounter(this.register.getProgramCounter() + step);
  }

  static readonly MACHINE_INSTRUCTION_IMPLIMENTATION: { [key: number]: MachineInstruction } = Object.freeze({
    [MACHINE_INSTRUCTION_NUMBER.AND[1]]: new AND1(),
    [MACHINE_INSTRUCTION_NUMBER.AND[2]]: new AND2(),
    [MACHINE_INSTRUCTION_NUMBER.LD[1]]: new LD1(),
    [MACHINE_INSTRUCTION_NUMBER.LD[2]]: new LD2(),
    [MACHINE_INSTRUCTION_NUMBER.LAD[2]]: new LAD2(),
    [MACHINE_INSTRUCTION_NUMBER.ST[2]]: new ST2(),
    [MACHINE_INSTRUCTION_NUMBER.SUBA[1]]: new SUBA1(),
    [MACHINE_INSTRUCTION_NUMBER.ADDA[2]]: new ADDA2(),
    [MACHINE_INSTRUCTION_NUMBER.CPA[1]]: new CPA1(),
    [MACHINE_INSTRUCTION_NUMBER.CPA[2]]: new CPA2(),
    [MACHINE_INSTRUCTION_NUMBER.JUMP[2]]: new JUMP2(),
    [MACHINE_INSTRUCTION_NUMBER.JZE[2]]: new JZE2(),
    [MACHINE_INSTRUCTION_NUMBER.JMI[2]]: new JMI2(),
    [MACHINE_INSTRUCTION_NUMBER.JPL[2]]: new JPL2(),
    [MACHINE_INSTRUCTION_NUMBER.SVC[2]]: new SVC2(),
  });
}
