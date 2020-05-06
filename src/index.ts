import { sampleSource } from './sample_source';

type MemoryAddress = number;
type WordValue = string;
type FlagValue = 0 | 1;

enum REGISTER_NAME {
  PR = 'PR',
  GR0 = 'GR0',
  GR1 = 'GR1',
  GR2 = 'GR2',
  GR3 = 'GR3',
  GR4 = 'GR4',
  GR5 = 'GR5',
  GR6 = 'GR6',
  GR7 = 'GR7',
  OF = 'OF',
  SF = 'SF',
  ZF = 'ZF'
}

enum PSEUDO_INSTRUCTION_NAME {
  DC = 'DC',
  DS = 'DS',
  START = 'START',
  END = 'END'
}

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

const ONE_WORD_INSTRUCTION_NAMES = ['RET'];

function isMachineInstruction(value: string): boolean {
  return Object.keys(MACHINE_INSTRUCTION_NUMBER).includes(value);
}

function toInstructionNumber(name: string): number {
  return MACHINE_INSTRUCTION_NUMBER[name];
}

function isOneWordInstruction(value: string): boolean {
  return ONE_WORD_INSTRUCTION_NAMES.includes(value);
}

function extractRegisterNumber(value: string): string {
  return value.slice(-1);
}

function isRegister(value: string): boolean {
  return Object.keys(REGISTER_NAME).includes(value);
}

class Memory {
  private values: { [key: number]: WordValue } = {};

  getValueAt(address: MemoryAddress): WordValue {
    return this.values[address];
  }

  setValueAt(address: MemoryAddress, value: WordValue) {
    this.values[address] = value;
  }
}

class Register {
  private programCounter: MemoryAddress = 0;
  private gRValues: { [key: string]: WordValue } = {};
  private flagValues: { [key: string]: FlagValue } = {};

  getSignFlag(): FlagValue {
    return this.flagValues[REGISTER_NAME.SF];
  }

  getZeroFlag(): FlagValue {
    return this.flagValues[REGISTER_NAME.ZF];
  }

  getOverflowFlag(): FlagValue {
    return this.flagValues[REGISTER_NAME.OF];
  }

  setFlags(o: FlagValue, s: FlagValue, z: FlagValue) {
    this.flagValues[REGISTER_NAME.OF] = o;
    this.flagValues[REGISTER_NAME.SF] = s;
    this.flagValues[REGISTER_NAME.ZF] = z;
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
    return `GR${index}`;
  }
}

(async function () {
  const source: (string[])[] = sampleSource;

  const memory = new Memory();
  const register = new Register();

  const toLateInit: [MemoryAddress, number][] = [];

  let wordCount = 0;
  const labelToAddrMap: { [key: string]: MemoryAddress } = {};
  // まずラベルの対応付け、DC, DSを処理する
  source.forEach(function (line, index) {
    if (line[0].length) {
      labelToAddrMap[line[0]] = wordCount;
    }
    if (line[1] === PSEUDO_INSTRUCTION_NAME.START || line[1] === PSEUDO_INSTRUCTION_NAME.END) {
      // TODO: STARTの引数をとるようにする
      return;
    }
    if (line[1] === PSEUDO_INSTRUCTION_NAME.DC) {
      memory.setValueAt(wordCount, line[2]);
      // TODO: ここで内容文の語数を確保する
      wordCount += 1;
    } else if (line[1] === PSEUDO_INSTRUCTION_NAME.DS) {
      memory.setValueAt(wordCount, '');
      // TODO: ここで内容文の語数を確保する
      wordCount += 1;
    } else {
      memory.setValueAt(wordCount, '');
      toLateInit.push([wordCount, index]);
      if (isMachineInstruction(line[1])) {
        if (isOneWordInstruction(line[1])) {
          memory.setValueAt(wordCount, '');
          wordCount += 1;
        } else {
          memory.setValueAt(wordCount, '');
          wordCount += 1;
          memory.setValueAt(wordCount, '');
          wordCount += 1;
        }
      } else {
        throw new Error(`未実装 ${line[1]}`);
      }
    }
  });
  console.log('アセンブラ命令処理完了');
  console.log(memory);

  function getAddressByLabel(labelName: string): number {
    const address = labelToAddrMap[labelName];
    if (!address) {
      throw new Error(`未定義のラベル ${labelName}`);
    }
    return address;
  }

  toLateInit.forEach(function (args) {
    const line = source[args[1]];
    const operands = [];
    operands.push(toInstructionNumber(line[1]));
    if (line[2].length) {
      if (isRegister(line[2])) {
        operands.push(extractRegisterNumber(line[2]));
        if (line[3].length && isRegister(line[3])) {
          operands.push(extractRegisterNumber(line[3]));
        } else if (line[4].length && isRegister(line[4])) {
          operands.push(extractRegisterNumber(line[4]));
        } else {
          operands.push('0');
        }
      } else {
        // 汎用レジスタ指標レジスタ部分のスペースを埋める
        operands.push('0');
        operands.push('0');
        // TODO: 本当はここでラベルかアドレスかの判定が必要
        const operand2 = getAddressByLabel(line[2]);
        operands.push(`${operand2}`);
      }
    }
    if (line[3].length) {
      if (!isRegister(line[3])) {
        // TODO: 本当はここでラベルかアドレスかの判定が必要
        const operand3 = getAddressByLabel(line[3]);
        operands.push(`${operand3}`);
      }
    }
    // TODO: 本当はここで語単位にまとめていきたい
    if (operands.length <= 3) {
      memory.setValueAt(args[0], operands.join(','));
    } else {
      memory.setValueAt(args[0], operands.slice(0, 3).join(','));
      memory.setValueAt(args[0] + 1, operands.slice(3, 4).join(','));
    }
  });
  console.log('コンパイル完了');
  console.log(memory);

  // TODO: START命令からの値を入れるようにする
  register.setProgramCounter(0);
  while (true) {
    let currentAddress = register.getProgramCounter();
    const instructionLine = memory.getValueAt(currentAddress);
    console.log(instructionLine);
    const valueLine = memory.getValueAt(currentAddress + 1) || '';
    const args = instructionLine.split(',');
    const valueArgs = valueLine.split(',');
    const instruction = Number(args[0]);
    if (instruction === MACHINE_INSTRUCTION_NUMBER.LD) {
      // TODO: ここでレジスタ間の移動、指標レジスタ考慮を要実装
      register.setGRAt(Number(args[1]), memory.getValueAt(Number.parseInt(valueArgs[0])));
      console.log(register);
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.ST) {
      memory.setValueAt(Number.parseInt(valueArgs[0]), register.getGRAt(Number(args[1])));
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.SUBA) {
      // TODO: ここでレジスタとメモリ間の比較を要実装
      const r1Value = Number(register.getGRAt(Number(args[1])));
      const r2Value = Number(register.getGRAt(Number(args[2])));
      register.setGRAt(Number(args[1]), `${r1Value - r2Value}`);
      console.log(register);
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.CPA) {
      // TODO: ここでレジスタとメモリ間の比較を要実装
      // TODO: オーバーフロー要考慮
      const r1Value = Number(register.getGRAt(Number(args[1])));
      const r2Value = Number(register.getGRAt(Number(args[2])));
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
      register.setProgramCounter(Number(valueArgs[0]));
      continue;
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.JZE) {
      if (register.getZeroFlag() === 1) {
        register.setProgramCounter(Number(valueArgs[0]));
        continue;
      }
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.JMI) {
      if (register.getSignFlag() === 1) {
        register.setProgramCounter(Number(valueArgs[0]));
        continue;
      }
    }
    if (instruction === MACHINE_INSTRUCTION_NUMBER.RET) {
      console.log('処理終了');
      console.log(register);
      console.log(memory);
      break;
    }
    if (isOneWordInstruction(args[0])) {
      currentAddress += 1;
    } else {
      currentAddress += 2
    }
    register.setProgramCounter(currentAddress);
  }
})();
