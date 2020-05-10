import { MemoryAddress, MACHINE_INSTRUCTION_NUMBER, WordValue, parseConst } from "./utils";
import { Memory } from "./memory";
import { LineAnalyzer } from "./line_analyzer";

export class Compiler {
  private labelAddrsToReplace: [MemoryAddress, string][] = [];
  private lineAnalyzer = new LineAnalyzer();
  private literalValues: [MemoryAddress, WordValue][] = [];
  private addressCounter: number = 0;
  private memoryAddressToSourceindexMap: { [key: number]: number } = {};

  constructor(
    private memory: Memory,
    private beginAddr: number,
    private source: string[][],
    private labelToAddrMap: { [key: string]: MemoryAddress }) {
  }

  compile() {
    this.parseAndAllocate();
    this.solveLabels();
    this.allocateLiteralValues();
  }

  addrToSourceIndexMap(): { [key: number]: number } {
    return { ...this.memoryAddressToSourceindexMap };
  }

  private parseAndAllocate() {
    let currentAddress = this.beginAddr;
    // まずラベルの対応付け、DC, DSを処理する
    this.source.forEach((args, sourceIndex) => {
      this.lineAnalyzer.load(args);
      const label = this.lineAnalyzer.parseLabel();
      if (label) {
        this.labelToAddrMap[label] = currentAddress;
      }
      let size = 0;
      if (this.lineAnalyzer.isMachineInstruction()) {
        size = this.compileMachineInstruction(currentAddress, args);
      } else {
        size = this.compilePseudoOrMacroInstruction(currentAddress, args);
      }
      if (size === 0) {
        return;
      }
      this.memoryAddressToSourceindexMap[currentAddress] = sourceIndex;
      currentAddress += size;
    });
    this.addressCounter = currentAddress;
  }

  private solveLabels() {
    this.labelAddrsToReplace.forEach(([address, label]) => {
      const value = this.labelToAddrMap[label];
      if (!value) {
        throw new Error(`未定義のラベル ${label}`);
      }
      this.memory.setValueAt(address, this.labelToAddrMap[label]);
    });
  }

  private compilePseudoOrMacroInstruction(currentAddress: number, args: string[]): number {
    const instruction = args[1];
    if (instruction === 'START' || instruction === 'END') {
      // TODO: STARTの引数をとるようにする
      return 0;
    }
    if (instruction === 'DC') {
      // TODO: ここで内容分の語数を確保する
      const operands = this.lineAnalyzer.parseOperands();
      operands.forEach((item, index) => {
        const parsedValue = parseConst(item);
        if (!parsedValue) {
          throw new Error(`不正な定数 ${item}`);
        }
        this.memory.setValueAt(currentAddress + index, parsedValue);
      });
      return operands.length;
    }
    if (instruction === 'DS') {
      const lengthStr = this.lineAnalyzer.parseOperands()[0];
      const length = Number.parseInt(lengthStr);
      if (isNaN(length)) {
        throw new Error(`不正な定数 ${length}`);
      }
      for (let i = 0; i < length; i++) {
        this.memory.setValueAt(currentAddress + i, 0);
      }
      return length;
    }
    if (instruction === 'OUT') {
      this.memory.setValueAt(currentAddress, MACHINE_INSTRUCTION_NUMBER.SVC[2] * 0x100 | 2);
      this.memory.setValueAt(currentAddress + 1, 0);
      this.memory.setValueAt(currentAddress + 2, 0);
      const operands = this.lineAnalyzer.parseOperands();
      this.labelAddrsToReplace.push([currentAddress + 1, operands[0]]);
      this.labelAddrsToReplace.push([currentAddress + 2, operands[1]]);
      return 3;
    }
    throw new Error(`未定義の命令 ${instruction}`);
  }

  private compileMachineInstruction(currentAddress: number, args: string[]) {
    this.memory.setValueAt(currentAddress, this.lineAnalyzer.buildFirstWord());
    if (!this.lineAnalyzer.hasAddrValue()) {
      return 1;
    }
    const nextAddress = currentAddress + 1;
    const constValue = this.lineAnalyzer.parseAddrConstAddr();
    if (constValue !== null) {
      this.memory.setValueAt(nextAddress, constValue);
      return 2;
    }
    const literalValue = this.lineAnalyzer.parseLiteralValue();
    if (literalValue !== null) {
      this.literalValues.push([nextAddress, literalValue]);
      this.memory.setValueAt(nextAddress, 0);
      return 2;
    }
    const addrLabel = this.lineAnalyzer.parseAddrLabel();
    if (addrLabel === null) {
      throw new Error(`2語目の形式が不正 ${args}`);
    }
    this.memory.setValueAt(nextAddress, 0);
    this.labelAddrsToReplace.push([nextAddress, addrLabel]);
    return 2;
  }

  private allocateLiteralValues() {
    let currenAddress = this.addressCounter;
    this.literalValues.forEach(([targetAddress, value]) => {
      this.memory.setValueAt(currenAddress, value);
      this.memory.setValueAt(targetAddress, currenAddress);
      currenAddress += 1;
    });
  }
}
