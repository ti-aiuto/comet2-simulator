import { sampleSource } from './sample_source';

type WordValue = string;

enum PSEUDO_INSTRUCTION {
  DC = 'DC',
  DS = 'DS'
}

(async function () {
  const source: (string[])[] = sampleSource;

  const MEMORY: { [key: number]: WordValue } = {};

  let wordCount = 0;
  const labelToAddrMap: { [key: string]: number } = {};
  // アセンブラ命令の処理
  // まずラベルの対応、DC, DSを処理する
  source.forEach(function (line) {
    if (line[0].length) {
      labelToAddrMap[line[0]] = wordCount;
    }
    if (line[1] === PSEUDO_INSTRUCTION.DC) {
      MEMORY[wordCount] = line[2];
    } else if (line[1] === PSEUDO_INSTRUCTION.DS) {
      MEMORY[wordCount] = '';
    } else {
      MEMORY[wordCount] = JSON.stringify(line.slice(1, 5)); // TODO: ここで2語の命令に変換したい
    }
    wordCount += 2; // TODO: DCで複数語文の定義を要考慮
  });

  // GRの後ろ、SPはいったん無視
  const REGISTERS: { [key: string]: WordValue } = {
    PR: '',
    GR0: '',
    GR1: '',
    GR2: '',
    GR3: '',
    GR4: '',
    OF: '',
    SF: '',
    ZF: ''
  };

  const INSTRUCTIONS = {
    LD(rOrR1: string, adrOrR2: string, x: string) {

    }
  };
})();
