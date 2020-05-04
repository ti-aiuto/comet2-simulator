import { sampleSource } from './sample_source';

type WordValue = string;

(async function () {
  console.log(sampleSource);
  // レジスタ系
  // PR
  // 汎用レジスタ、指標レジスタ
  // GR0, GR1, GR2, GR3, GR4, GR5, GR6, GR7
  // FR: OF, SF, ZF
  // SPはいったん無視

  const source: (string[])[] = sampleSource;

  // TODO: keyをいったんlabelにしているが、いつかアドレスにする
  const MEMORY: {[key: string]: WordValue} = {};

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
