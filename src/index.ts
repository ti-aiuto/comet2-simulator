import { sampleSource } from './sample_source';

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

  let wordCount = 0;
  const labelToAddrMap: { [key: string]: number } = {};
  // まずラベルの対応付け、DC, DSを処理する
  source.forEach(function (line) {
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
      MEMORY[wordCount] = JSON.stringify(line.slice(1, 5)); // TODO: ここで1語or2語の命令に変換したい
      if (Object.keys(MACHINE_INSTRUCTION_NAME).includes(line[1])) {
        if (ONE_WORD_INSTRUCTION_NAMES.includes(line[1])) {
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

  const INSTRUCTIONS = {
    LD(rOrR1: string, adrOrR2: string, x: string) {

    }
  };
})();
