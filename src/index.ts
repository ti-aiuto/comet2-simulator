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
  DS = 'DS'
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

  let wordCount = 0;
  const labelToAddrMap: { [key: string]: number } = {};
  // まずラベルの対応付け、DC, DSを処理する
  source.forEach(function (line) {
    if (line[0].length) {
      labelToAddrMap[line[0]] = wordCount;
    }
    if (line[1] === PSEUDO_INSTRUCTION_NAME.DC) {
      MEMORY[wordCount] = line[2];
    } else if (line[1] === PSEUDO_INSTRUCTION_NAME.DS) {
      MEMORY[wordCount] = '';
    } else {
      MEMORY[wordCount] = JSON.stringify(line.slice(1, 5)); // TODO: ここで1語or2語の命令に変換したい
    }
    // TODO: DCで複数語文の定義を要考慮
    if (line[3].length) {
      if (Object.keys(REGISTER_NAME).includes(line[3])) {
        // 第二引数がレジスタの場合
        wordCount += 1;
      } else {
        // 第二引数がアドレスの場合
        wordCount += 2;
      }
    } else {
      wordCount += 1;
    }
  });
  console.log('アセンブラ命令処理完了');
  console.log(MEMORY);

  const INSTRUCTIONS = {
    LD(rOrR1: string, adrOrR2: string, x: string) {

    }
  };
})();
