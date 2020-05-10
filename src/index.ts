import fs from 'fs';
import readline from 'readline';

import { Memory } from './memory';
import { Register } from './register';
import { Compiler } from './compiler';
import { Machine } from './machine';
import { parseSource, toWordHex, MemoryDump, ParsedSource } from './utils';
import { IO } from './io';

function memoryDebugInfo(memoryDump: MemoryDump, addrToSource: { [key: number]: number }, source: ParsedSource): [string, string, string[]][] {
  return memoryDump.map((line) => {
    const [addr, value] = line;
    const sourceIndex = addrToSource[addr];
    return [toWordHex(addr), toWordHex(value), sourceIndex ? source[sourceIndex] : null || []];
  });
}

(async function () {
  const sourceText = fs.readFileSync(process.argv[2], 'utf-8').toString();
  const source: (string[])[] = parseSource(sourceText);

  const memory = new Memory();
  const register = new Register();

  const labelToAddrMap = {};

  const compiler = new Compiler(memory, 0, source, labelToAddrMap);
  compiler.compile();
  const addrToSourceIndex = compiler.addrToSourceIndexMap();
  console.log('コンパイル完了');
  console.log(memoryDebugInfo(memory.dump(), addrToSourceIndex, source));

  const io = new IO(async () => {
    return '';
  }, async (value: string) => {
    console.log(value);
  });

  // TODO: START命令から開始位置を持ってくる
  const controller = new Machine(memory, register, io).executeInteractive(0);
  const readlineStdin = readline.createInterface(process.stdin, process.stdout);

  readlineStdin.on("line", function () {
    (async () => {
      console.log(`PC: ${toWordHex(register.getProgramCounter())}`);
      const result = await controller.executeNext();
      console.log(memoryDebugInfo(memory.dump(), addrToSourceIndex, source));
      console.log(register.toString());
      console.log('---');
      if (result === false) {
        readlineStdin.close();
        console.log('処理終了');
        console.log(memoryDebugInfo(memory.dump(), addrToSourceIndex, source));
        console.log(register.toString());
      }
    })();
  });
})();
