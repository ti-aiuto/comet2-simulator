import { MemoryAddress, MACHINE_INSTRUCTION_NUMBER } from "./utils";
import { Memory } from "./memory";
import { LineAnalyzer } from "./line_analyzer";

export class Compiler {
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
      this.lineAnalyzer.load(args);
      const label = this.lineAnalyzer.parseLabel();
      if (label) {
        this.labelToAddrMap[label] = currentAddress;
      }
      if (this.lineAnalyzer.isMachineInstruction()) {
        currentAddress += this.compileMachineInstruction(currentAddress, args);
        return;
      }
      currentAddress += this.compilePseudoOrMacroInstruction(currentAddress, args);
    });
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
      this.memory.setValueAt(currentAddress, Number(args[2]));
      // TODO: ここで内容分の語数を確保する
      return 1;
    }
    if (instruction === 'DS') {
      this.memory.setValueAt(currentAddress, 0);
      // TODO: ここで内容分の語数を確保する
      return 1;
    }
    if (instruction === 'OUT') {
      this.memory.setValueAt(currentAddress, MACHINE_INSTRUCTION_NUMBER.SVC[2]);
      this.memory.setValueAt(currentAddress + 1, 0);
      this.memory.setValueAt(currentAddress + 2, 0);
      this.labelAddrsToReplace.push([currentAddress + 1, args[2]]);
      this.labelAddrsToReplace.push([currentAddress + 2, args[3]]);
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
