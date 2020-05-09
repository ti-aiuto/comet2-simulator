import { MACHINE_INSTRUCTION_NUMBER, WordValue, MemoryAddress, GENERAL_REGISTER_NAMES } from "./utils";

export class LineAnalyzer {
  constructor(private args: string[] = []) {
  }

  load(args: string[]) {
    this.args = args;
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
    if (this.args[2].length) {
      if (this.isGeneralRegister(this.args[2])) {
        // r1
        word |= this.extractRegisterNumber(this.args[2]) * 0x10;
        if (this.args[3].length) {
          if (this.isGeneralRegister(this.args[3])) {
            // r2
            word |= this.extractRegisterNumber(this.args[3]);
          } else {
            // addr
            wordLength = 2;
          }
        } else if (this.args[4].length && this.isGeneralRegister(this.args[4])) {
          // x
          word |= this.extractRegisterNumber(this.args[4]);
        }
      } else {
        // addr
        wordLength = 2;
        if (this.args[3].length && this.isGeneralRegister(this.args[3])) {
          // addr, x
          word |= this.extractRegisterNumber(this.args[3]);
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
    return this.parseConst(value.substring(1));
  }

  parseAddrConstAddr(): MemoryAddress | null {
    return this.parseConst(this.extractAddrRawValue());
  }

  private parseConst(value: string | null): number | null {
    if (!value) {
      return null;
    }
    if (value.startsWith('#')) {
      return Number.parseInt(value.substring(1), 16);
    }
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'].includes(value[0])) {
      return Number.parseInt(value);
    }
    return null;
  }

  private extractAddrRawValue(): string | null {
    if (this.args[2].length > 0 && !this.isGeneralRegister(this.args[2])) {
      return this.args[2];
    }
    if (this.args[3].length > 0 && !this.isGeneralRegister(this.args[3])) {
      return this.args[3];
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
