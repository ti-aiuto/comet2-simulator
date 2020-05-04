import { sampleSource } from './sample_source';

type MemoryAddress = number;
type WordValue = string;

enum REGISTER_NAME {
  PR = 'PR',
  GR0 = 'GR0',
  GR1 = 'GR1',
  GR2 = 'GR2',
  GR3 = 'GR3',
  GR4 = 'GR4',
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

enum MACHINE_INSTRUCTION_NAME {
  LD = 'LD',
  ST = 'ST',
  CPA = 'CPA',
  JZE = 'JZE',
  JMI = 'JMI',
  SUBA = 'SUBA',
  JUMP = 'JUMP',
  RET = 'RET'
}

const ONE_WORD_INSTRUCTION_NAMES = ['RET'];

function isMachineInstruction(value: string): boolean {
  return Object.keys(MACHINE_INSTRUCTION_NAME).includes(value);
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

(async function () {
  const source: (string[])[] = sampleSource;

  // GRの後ろ、SPはいったん無視
  const REGISTERS: { [key: string]: WordValue } = {
    [REGISTER_NAME.PR]: '',
    [REGISTER_NAME.GR0]: '',
    [REGISTER_NAME.GR1]: '',
    [REGISTER_NAME.GR2]: '',
    [REGISTER_NAME.GR3]: '',
    [REGISTER_NAME.GR4]: '',
    [REGISTER_NAME.OF]: '',
    [REGISTER_NAME.SF]: '',
    [REGISTER_NAME.ZF]: ''
  };

  const MEMORY: { [key: number]: WordValue } = {};
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
      MEMORY[wordCount] = line[2];
      // TODO: ここで内容文の語数を確保する
      wordCount += 1;
    } else if (line[1] === PSEUDO_INSTRUCTION_NAME.DS) {
      MEMORY[wordCount] = '';
      // TODO: ここで内容文の語数を確保する
      wordCount += 1;
    } else {
      MEMORY[wordCount] = '';
      toLateInit.push([wordCount, index]);
      if (isMachineInstruction(line[1])) {
        if (isOneWordInstruction(line[1])) {
          wordCount += 1;
        } else {
          wordCount += 2;
        }
      } else {
        throw new Error(`未実装 ${line[1]}`);
      }
    }
  });
  console.log('アセンブラ命令処理完了');
  console.log(MEMORY);

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
    operands.push(line[1]);
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
    MEMORY[args[0]] = operands.join(',');
  });
  console.log('コンパイル完了');
  console.log(MEMORY);

  REGISTERS[REGISTER_NAME.PR] = '0';
  while(REGISTERS[REGISTER_NAME.PR].length) {
    let currentAddress = Number(REGISTERS[REGISTER_NAME.PR]);
    const instructionLine = MEMORY[currentAddress]
    console.log(instructionLine);
    const args = instructionLine.split(',');
    const instruction = args[0];
    if (instruction === MACHINE_INSTRUCTION_NAME.JUMP) {
      REGISTERS[REGISTER_NAME.PR] = args[1];
      continue;
    }
    if (instruction === MACHINE_INSTRUCTION_NAME.RET) {
      console.log('処理終了');
      break;
    }
    if (isOneWordInstruction(args[0])) {
      currentAddress += 1;
    } else {
      currentAddress += 2
    }
    REGISTERS[REGISTER_NAME.PR] = `${currentAddress}`;
  }
})();
