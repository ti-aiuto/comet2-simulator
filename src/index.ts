import { sampleSource } from './sample_source';

type MemoryAddress = number;
type WordValue = number;
type FlagValue = 0 | 1;

const GENERAL_REGISTER_NAMES = ['GR0', 'GR1', 'GR2', 'GR3', 'GR4', 'GR5', 'GR6', 'GR7'] as const;
type GeneralRegisterName = typeof GENERAL_REGISTER_NAMES[number];

const MACHINE_INSTRUCTION_NUMBER: { [key: string]: number } = Object.freeze({
  LD: 0x10,
  ST: 0x11,
  CPA: 0x40,
  JZE: 0x63,
  JMI: 0x61,
  SUBA: 0x25,
  JUMP: 0x64,
  RET: 0x81
});

class LineAnalyzer {
  constructor(private args: string[] = []) {
  }

  update(args: string[]) {
    this.args = args;
  }

  convertFirstWord(): WordValue {
    let word = this.toInstructionNumber(this.args[1]) * 0x100;
    if (this.args[2].length) {
      if (this.isGeneralRegister(this.args[2])) {
        word |= this.extractRegisterNumber(this.args[2]) * 0x10;
        if (this.args[3].length && this.isGeneralRegister(this.args[3])) {
          word |= this.extractRegisterNumber(this.args[3]);
        } else if (this.args[4].length && this.isGeneralRegister(this.args[4])) {
          word |= this.extractRegisterNumber(this.args[4]);
        }
      }
    }
    return word;
  }

  hasAddrValue(): boolean {
    // TODO: 不正な値ならここで例外
    return !!this.extractAddrRawValue();
  }

  extractAddrLabel(): string | null {
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
    return (GENERAL_REGISTER_NAMES as Readonly<string[]>).includes(value);
  }

  private extractRegisterNumber(value: string): number {
    return Number(value.slice(-1));
  }

  private toInstructionNumber(name: string): number {
    const value = MACHINE_INSTRUCTION_NUMBER[name];
    if (value) {
      return value;
    }
    throw new Error(`未定義の機械語 ${name}`);
  }
}

class Compiler {
  private labelAddrsToReplace: [MemoryAddress, string][] = [];
  private lineAnalyzer = new LineAnalyzer();

  constructor(
    private memory: Memory,
    private source: string[][],
    private labelToAddrMap: { [key: string]: MemoryAddress }) {
  }

  compile() {
    this.compilePseudoInstructions();
    this.compileMachineInstructions();
  }

  private compilePseudoInstructions() {
    let wordCount = 0;
    // まずラベルの対応付け、DC, DSを処理する
    this.source.forEach((args) => {
      const [label, instruction] = args;
      if (label.length) {
        this.labelToAddrMap[args[0]] = wordCount;
      }
      if (instruction === 'START' || instruction === 'END') {
        // TODO: STARTの引数をとるようにする
        return;
      }
      if (instruction === 'DC') {
        this.memory.setValueAt(wordCount, Number(args[2]));
        // TODO: ここで内容分の語数を確保する
        wordCount += 1;
        return;
      }
      if (instruction === 'DS') {
        this.memory.setValueAt(wordCount, 0);
        // TODO: ここで内容分の語数を確保する
        wordCount += 1;
        return;
      }
      this.lineAnalyzer.update(args);
      this.memory.setValueAt(wordCount, this.lineAnalyzer.convertFirstWord());
      wordCount += 1;
      if (!this.lineAnalyzer.hasAddrValue()) {
        return;
      }
      let addrLabel = this.lineAnalyzer.extractAddrLabel();
      if (addrLabel) {
        this.memory.setValueAt(wordCount, 0);
        this.labelAddrsToReplace.push([wordCount, addrLabel]);
      } else {
        this.memory.setValueAt(wordCount, this.lineAnalyzer.parseAddrValue());
      }
      wordCount += 1;
    });
    console.log('アセンブラ命令処理完了');
    console.log(this.memory.toString());
  }

  private compileMachineInstructions() {
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
}

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

class Register {
  private programCounter: MemoryAddress = 0;
  private gRValues: { [key in GeneralRegisterName]: WordValue } = {
    'GR0': 0, 'GR1': 0, 'GR2': 0, 'GR3': 0, 'GR4': 0,
    'GR5': 0, 'GR6': 0, 'GR7': 0
  };
  private flagValues: { [key in 'OF' | 'SF' | 'ZF']: FlagValue } = { OF: 0, SF: 0, ZF: 0 };

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

  private gRKeyNameOf(index: number): GeneralRegisterName {
    const name = `GR${index}`;
    if ((GENERAL_REGISTER_NAMES as Readonly<string[]>).includes(name)) {
      return name as GeneralRegisterName;
    }
    throw new Error(`未定義のGR ${index}`);
  }
}

(async function () {
  const source: (string[])[] = sampleSource;

  const memory = new Memory();
  const register = new Register();

  new Compiler(memory, source, {}).compile();

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
    if (instruction === MACHINE_INSTRUCTION_NUMBER.LD) {
      // TODO: ここでレジスタ間の移動、指標レジスタ考慮を要実装
      register.setGRAt(gR, memory.getValueAt(addr));
      usedAddr = true;
      console.log(register);
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.ST) {
      memory.setValueAt(addr, register.getGRAt(gR));
      usedAddr = true;
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.SUBA) {
      // TODO: ここでレジスタとメモリ間の比較を要実装
      const r1Value = register.getGRAt(gR);
      const r2Value = register.getGRAt(gROrIR);
      register.setGRAt(gR, r1Value - r2Value);
      console.log(register);
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.CPA) {
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
    if (instruction === MACHINE_INSTRUCTION_NUMBER.JUMP) {
      register.setProgramCounter(addr);
      continue;
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.JZE) {
      if (register.getZeroFlag() === 1) {
        register.setProgramCounter(addr);
        continue;
      }
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.JMI) {
      if (register.getSignFlag() === 1) {
        register.setProgramCounter(addr);
        continue;
      }
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.RET) {
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
