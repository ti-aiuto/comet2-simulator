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

  setDebugInfoAt(address: MemoryAddress, value: string) {
    this.debugInfo[address] = value;
  }

  toString(): string {
    let result = '';
    // TODO: ここで順序を保証する
    for (let [key, value] of Object.entries(this.values)) {
      result += `${toWordHex(Number(key))}: ${toWordHex(Number(value))} ; ${this.debugInfo[Number(key)] || ''}\n`
    }
    return result.trim();
  }
}
