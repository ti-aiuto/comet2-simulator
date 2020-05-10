import { WordValue, toWordHex, MemoryAddress, MemoryDump } from "./utils";

export class Memory {
  private values: { [key: number]: WordValue } = {};

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
      result += `${toWordHex(Number(key))}: ${toWordHex(Number(value))}\n`
    }
    return result.trim();
  }

  dump(): MemoryDump {
    return Object.keys(this.values).map(key => [Number(key), this.values[Number(key)]]);
  }
}
