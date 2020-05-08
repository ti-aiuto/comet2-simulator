import { sampleSource } from './sample_source';

type MemoryAddress = number;
type WordValue = number;
type FlagValue = 0 | 1;

const GENERAL_REGISTER_NAMES = Object.freeze(['GR0', 'GR1', 'GR2', 'GR3', 'GR4', 'GR5', 'GR6', 'GR7']);

const MACHINE_INSTRUCTION_NUMBER: { [key: string]: { [key: number]: number } } = Object.freeze({
  LD: { 2: 0x10 },
  ST: { 2: 0x11 },
  CPA: { 1: 0x40 },
  JZE: { 2: 0x63 },
  JMI: { 2: 0x61 },
  SUBA: { 1: 0x25 },
  JUMP: { 2: 0x64 },
  RET: { 1: 0x81 }
});

function toWordHex(num: number): string {
  return ('0000' + (num.toString(16))).slice(-4);
}

class Memory {
  private values: { [key: number]: WordValue } = {};

  getValueAt(address: MemoryAddress): WordValue {
    return this.values[address];
  }

  setValueAt(address: MemoryAddress, value: WordValue) {
    this.values[address] = value;
  }

  toString(): string {
    let result = '';
    for (let [key, value] of Object.entries(this.values)) {
      result += `${toWordHex(Number(key))}: ${toWordHex(Number(value))}\n`.toUpperCase()
    }
    return result.trim();
  }
}

class LineAnalyzer {
  constructor(private args: string[] = []) {
  }

  update(args: string[]) {
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
        word |= this.extractRegisterNumber(this.args[2]) * 0x10;
        if (this.args[3].length) {
          if (this.isGeneralRegister(this.args[3])) {
            word |= this.extractRegisterNumber(this.args[3]);
          } else {
            wordLength = 2;
          }
        } else if (this.args[4].length && this.isGeneralRegister(this.args[4])) {
          word |= this.extractRegisterNumber(this.args[4]);
        }
      } else {
        wordLength = 2;
      }
    }
    const instructionNumber = this.toInstructionNumber(this.args[1], wordLength);
    if (!instructionNumber) {
      throw new Error(`未定義の機械語 ${name}`);
    }
    word |= instructionNumber * 0x100;
    return word;
  }

  hasAddrValue(): boolean {
    // TODO: 不正な値ならここで例外
    return !!this.extractAddrRawValue();
  }

  parseAddrLabel(): string | null {
    // TODO: 本当はここでラベルかアドレスかの判定が必要
    return this.extractAddrRawValue();
  }

  parseAddrValue(): MemoryAddress {
    // TODO: 要実装
    return 0;
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

class Compiler {
  private labelAddrsToReplace: [MemoryAddress, string][] = [];
  private lineAnalyzer = new LineAnalyzer();

  constructor(
    private memory: Memory,
    private beginAddr: number,
    private source: string[][],
    private labelToAddrMap: { [key: string]: MemoryAddress }) {
  }

  compile() {
    this.parseAndAllocate();
    this.solveLabels();
  }

  private parseAndAllocate() {
    let currentAddress = this.beginAddr;
    // まずラベルの対応付け、DC, DSを処理する
    this.source.forEach((args) => {
      this.lineAnalyzer.update(args);
      const label = this.lineAnalyzer.parseLabel();
      if (label) {
        this.labelToAddrMap[label] = currentAddress;
      }
      if (this.lineAnalyzer.isMachineInstruction()) {
        currentAddress += this.compileMachineInstruction(currentAddress, args);
        return;
      }
      currentAddress += this.compilePseudoInstruction(currentAddress, args);
    });
    console.log('アセンブラ命令処理完了');
    console.log(this.memory.toString());
  }

  private solveLabels() {
    this.labelAddrsToReplace.forEach(([address, label]) => {
      const value = this.labelToAddrMap[label];
      if (!value) {
        throw new Error(`未定義のラベル ${label}`);
      }
      this.memory.setValueAt(address, this.labelToAddrMap[label]);
    });
    console.log('コンパイル完了');
    console.log(this.memory.toString());
  }

  private compilePseudoInstruction(currentAddress: number, args: string[]): number {
    const instruction = args[1];
    if (instruction === 'START' || instruction === 'END') {
      // TODO: STARTの引数をとるようにする
      return 0;
    }
    if (instruction === 'DC') {
      this.memory.setValueAt(currentAddress, Number(args[2]));
      // TODO: ここで内容分の語数を確保する
      return 1;
    }
    if (instruction === 'DS') {
      this.memory.setValueAt(currentAddress, 0);
      // TODO: ここで内容分の語数を確保する
      return 1;
    }
    throw new Error(`未定義の命令 ${instruction}`);
  }

  private compileMachineInstruction(currentAddress: number, args: string[]) {
    this.memory.setValueAt(currentAddress, this.lineAnalyzer.buildFirstWord());
    if (!this.lineAnalyzer.hasAddrValue()) {
      return 1;
    }
    const nextAddress = currentAddress + 1;
    const addrLabel = this.lineAnalyzer.parseAddrLabel();
    if (addrLabel) {
      this.memory.setValueAt(nextAddress, 0);
      this.labelAddrsToReplace.push([nextAddress, addrLabel]);
    } else {
      this.memory.setValueAt(nextAddress, this.lineAnalyzer.parseAddrValue());
    }
    return 2;
  }
}

class Register {
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

  private gRKeyNameOf(index: number): string {
    const name = `GR${index}`;
    if (GENERAL_REGISTER_NAMES.includes(name)) {
      return name;
    }
    throw new Error(`未定義のGR ${index}`);
  }
}

(async function () {
  const source: (string[])[] = sampleSource;

  const memory = new Memory();
  const register = new Register();

  new Compiler(memory, 0, source, {}).compile();

  // TODO: START命令からの値を入れるようにする
  register.setProgramCounter(0);
  while (true) {
    let currentAddress = register.getProgramCounter();
    const instructionLine = memory.getValueAt(currentAddress);
    console.log(instructionLine);
    const addr = memory.getValueAt(currentAddress + 1);
    const instruction = (instructionLine & 0xFF00) >> 8;
    const gR = (instructionLine & 0xF0) >> 4;
    const gROrIR = instructionLine & 0xF;
    let usedAddr = false;
    if (instruction === MACHINE_INSTRUCTION_NUMBER.LD[2]) {
      // TODO: ここでレジスタ間の移動、指標レジスタ考慮を要実装
      register.setGRAt(gR, memory.getValueAt(addr));
      usedAddr = true;
      console.log(register);
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.ST[2]) {
      memory.setValueAt(addr, register.getGRAt(gR));
      usedAddr = true;
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.SUBA[1]) {
      // TODO: ここでレジスタとメモリ間の比較を要実装
      const r1Value = register.getGRAt(gR);
      const r2Value = register.getGRAt(gROrIR);
      register.setGRAt(gR, r1Value - r2Value);
      console.log(register);
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.CPA[1]) {
      // TODO: ここでレジスタとメモリ間の比較を要実装
      // TODO: オーバーフロー要考慮
      const r1Value = register.getGRAt(gR);
      const r2Value = register.getGRAt(gROrIR);
      const result = r1Value - r2Value;
      if (result > 0) {
        register.setFlags(0, 0, 0);
      } else if (result === 0) {
        register.setFlags(0, 0, 1);
      } else {
        register.setFlags(0, 1, 0);
      }
      console.log(register);
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.JUMP[2]) {
      register.setProgramCounter(addr);
      continue;
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.JZE[2]) {
      if (register.getZeroFlag() === 1) {
        register.setProgramCounter(addr);
        continue;
      }
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.JMI[2]) {
      if (register.getSignFlag() === 1) {
        register.setProgramCounter(addr);
        continue;
      }
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.RET[1]) {
      console.log('処理終了');
      console.log(register);
      console.log(memory.toString());
      break;
    }
    if (usedAddr) {
      currentAddress += 2
    } else {
      currentAddress += 1;
    }
    register.setProgramCounter(currentAddress);
  }
})();
