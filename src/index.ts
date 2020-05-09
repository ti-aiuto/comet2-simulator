import fs from 'fs';

import { Memory } from './memory';
import { Register } from './register';
import { Compiler } from './compiler';
import { Machine } from './machine';

function parseSource(text: string): string[][] {
  return text
    .replace(/\r\n?/g, "\n")
    .trim()
    .split("\n")
    .map((line) => [...line.split("\t"), '', '', '', ''].slice(0, 5));
}

(function () {
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

  new Machine(memory, register, 0).execute();

  console.log('処理終了');
  console.log(register.toString());
  console.log(memory.toString());
})();
