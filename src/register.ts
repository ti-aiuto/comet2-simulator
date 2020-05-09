import { MemoryAddress, WordValue, FlagValue, GENERAL_REGISTER_NAMES, toWordHex } from "./utils";

export class Register {
  private programCounter: MemoryAddress = 0;
  private gRValues: { [key: string]: WordValue } = {};
  private flagValues: { [key in 'OF' | 'SF' | 'ZF']: FlagValue } = { OF: 0, SF: 0, ZF: 0 };

  constructor() {
    GENERAL_REGISTER_NAMES.forEach(name => this.gRValues[name] = 0);
  }

  getSignFlag(): FlagValue {
    return this.flagValues['SF'];
  }

  getZeroFlag(): FlagValue {
    return this.flagValues['ZF'];
  }

  getOverflowFlag(): FlagValue {
    return this.flagValues['OF'];
  }

  setFlags(o: FlagValue, s: FlagValue, z: FlagValue) {
    this.flagValues['OF'] = o;
    this.flagValues['SF'] = s;
    this.flagValues['ZF'] = z;
  }

  getGRAt(index: number): WordValue {
    return this.gRValues[this.gRKeyNameOf(index)];
  }

  setGRAt(index: number, value: WordValue) {
    this.gRValues[this.gRKeyNameOf(index)] = value;
  }

  getProgramCounter(): MemoryAddress {
    return this.programCounter;
  }

  setProgramCounter(value: MemoryAddress) {
    this.programCounter = value;
  }

  // TODO: SPを定義

  toString(): string {
    let result = '';
    result += ` PC: ${toWordHex(this.getProgramCounter())}\n`;
    result += ` OF: ${toWordHex(this.getOverflowFlag())}\n`;
    result += ` SF: ${toWordHex(this.getSignFlag())}\n`;
    result += ` ZF: ${toWordHex(this.getZeroFlag())}\n`;
    GENERAL_REGISTER_NAMES.forEach(name => result += `${name}: ${toWordHex(this.gRValues[name])}\n`);
    return result.trimRight();
  }

  private gRKeyNameOf(index: number): string {
    const name = `GR${index}`;
    if (GENERAL_REGISTER_NAMES.includes(name)) {
      return name;
    }
    throw new Error(`未定義のGR ${index}`);
  }
}
