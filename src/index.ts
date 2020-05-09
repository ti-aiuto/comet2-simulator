import fs from 'fs';

import { Memory } from './memory';
import { Register } from './register';
import { Compiler } from './compiler';
import { Machine } from './machine';
import { parseSource } from './utils';

(async function () {
  const sourceText = fs.readFileSync(process.argv[2], 'utf-8').toString();
  const source: (string[])[] = parseSource(sourceText);

  const memory = new Memory();
  const register = new Register();

  const labelToAddrMap = {};

  new Compiler(memory, 0, source, labelToAddrMap).compile();
  console.log('コンパイル完了');
  console.log(memory.toString());
  console.log('ラベル対応付け');
  console.log(labelToAddrMap);

  // TODO: START命令から開始位置を持ってくる
  await new Machine(memory, register, 0).execute();

  console.log('処理終了');
  console.log(register.toString());
  console.log(memory.toString());
})();
