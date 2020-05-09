import { MACHINE_INSTRUCTION_NUMBER, WordValue, MemoryAddress, GENERAL_REGISTER_NAMES, parseConst } from "./utils";

export class LineAnalyzer {
  private args: string[] = []
  private operands: string[] = [];

  constructor() {
  }

  load(args: string[]) {
    this.args = args;
    const operands = args[2].split(';')[0].split(',').map(item => item.trim());
    while (operands.length < 3) {
      operands.push('');
    }
    this.operands = operands;
  }

  parseLabel(): string | null {
    const label = this.args[0]
    if (label.length) {
      return label;
    }
    return null;
  }

  isMachineInstruction(): boolean {
    return Object.keys(MACHINE_INSTRUCTION_NUMBER).includes(this.args[1]);
  }

  buildFirstWord(): WordValue {
    let wordLength = 1;
    let word = 0;
    if (this.operands[0].length) {
      if (this.isGeneralRegister(this.operands[0])) {
        // r1
        word |= this.extractRegisterNumber(this.operands[0]) * 0x10;
        if (this.operands[1].length) {
          if (this.isGeneralRegister(this.operands[1])) {
            // r2
            word |= this.extractRegisterNumber(this.operands[1]);
          } else {
            // addr
            wordLength = 2;
          }
        } else if (this.operands[2].length && this.isGeneralRegister(this.operands[2])) {
          // x
          word |= this.extractRegisterNumber(this.operands[2]);
        }
      } else {
        // addr
        wordLength = 2;
        if (this.operands[1].length && this.isGeneralRegister(this.operands[1])) {
          // addr, x
          word |= this.extractRegisterNumber(this.operands[1]);
        }
      }
    }
    const instructionNumber = this.toInstructionNumber(this.args[1], wordLength);
    if (!instructionNumber) {
      throw new Error(`未定義の機械語 ${this.args[1]}(${wordLength})`);
    }
    word |= instructionNumber * 0x100;
    return word;
  }

  hasAddrValue(): boolean {
    // TODO: 不正な値ならここで例外
    return !!this.extractAddrRawValue();
  }

  parseAddrLabel(): string | null {
    return this.extractAddrRawValue();
  }

  parseLiteralValue(): WordValue | null {
    const value = this.extractAddrRawValue();
    if (!value || !value.startsWith('=')) {
      return null;
    }
    return parseConst(value.substring(1));
  }

  parseAddrConstAddr(): MemoryAddress | null {
    return parseConst(this.extractAddrRawValue());
  }

  parseOperands(): string[] {
    return [...this.operands];
  }

  private extractAddrRawValue(): string | null {
    if (this.operands[0].length > 0 && !this.isGeneralRegister(this.operands[0])) {
      return this.operands[0];
    }
    if (this.operands[1].length > 0 && !this.isGeneralRegister(this.operands[1])) {
      return this.operands[1];
    }
    return null;
  }

  private isGeneralRegister(value: string): boolean {
    return GENERAL_REGISTER_NAMES.includes(value);
  }

  private extractRegisterNumber(value: string): number {
    return Number(value.slice(-1));
  }

  private toInstructionNumber(name: string, length: number): number | null {
    const value = MACHINE_INSTRUCTION_NUMBER[name];
    if (value && value[length]) {
      return value[length];
    }
    return null;
  }
}
