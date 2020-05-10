import { WordValue, toWordHex, MemoryAddress } from "./utils";

export class Memory {
  private values: { [key: number]: WordValue } = {};
  private debugInfo: { [key: number]: string } = {};

  getValueAt(address: MemoryAddress): WordValue {
    return this.values[address];
  }

  setValueAt(address: MemoryAddress, value: WordValue) {
    this.values[address] = value;
  }

  toString(): string {
    let result = '';
    for (let key of Object.keys(this.values)) {
      const value = this.values[Number(key)];
      result += `${toWordHex(Number(key))}: ${toWordHex(Number(value))} ; ${this.debugInfo[Number(key)] || ''}\n`
    }
    return result.trim();
  }

  dump(): [MemoryAddress, WordValue][] {
    return Object.keys(this.values).map(key => [Number(key), this.values[Number(key)]]);
  }
}
