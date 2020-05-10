import fs from 'fs';
import readline from 'readline';

import { Memory } from './memory';
import { Register } from './register';
import { Compiler } from './compiler';
import { Machine } from './machine';
import { parseSource, toWordHex, MemoryDump, ParsedSource } from './utils';

function memoryDebugInfo(memoryDump: MemoryDump, addrToSource: { [key: number]: number }, source: ParsedSource): string[][] {
  return memoryDump.map((line) => {
    const [addr, value] = line;
    const result: string[] = [toWordHex(addr), toWordHex(value)];
    const sourceIndex = addrToSource[addr];
    if (sourceIndex) {
      const sourceLine = source[sourceIndex];
      if (sourceLine) {
        result.push(sourceLine.join(' '));
      }
    }
    return result;
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

  // TODO: START命令から開始位置を持ってくる
  const controller = new Machine(memory, register).executeInteractive(0);
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
