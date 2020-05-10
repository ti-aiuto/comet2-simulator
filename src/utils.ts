export type MemoryAddress = number;
export type WordValue = number;
export type FlagValue = 0 | 1;
export type MemoryDump = [MemoryAddress, WordValue][];
export type ParsedSource = string[][];

export const GENERAL_REGISTER_NAMES = Object.freeze(['GR0', 'GR1', 'GR2', 'GR3', 'GR4', 'GR5', 'GR6', 'GR7']);

export const MACHINE_INSTRUCTION_NUMBER: { [key: string]: { [key: number]: number } } = Object.freeze({
  AND: { 1: 0x34, 2: 0x30 },
  LD: { 1: 0x14, 2: 0x10 },
  ST: { 2: 0x11 },
  CPA: { 1: 0x44, 2: 0x40 },
  JZE: { 2: 0x63 },
  JMI: { 2: 0x61 },
  JPL: { 2: 0x65 },
  SUBA: { 1: 0x25 },
  ADDA: { 2: 0x20 },
  JUMP: { 2: 0x64 },
  RET: { 1: 0x81 },
  SVC: { 2: 0xFF },
  LAD: { 2: 0x12 }
});

export function toWordHex(num: number): string {
  return ('0000' + (num.toString(16))).slice(-4).toUpperCase();
}

export function parseSource(text: string): ParsedSource {
  return text
    .replace(/\r\n?/g, "\n")
    .trim()
    .split("\n")
    .map((line) => [...line.split("\t"), '', '', ''].slice(0, 4));
}

export function parseConst(value: string | null): number | null {
  if (!value) {
    return null;
  }
  if (value.startsWith('#')) {
    return Number.parseInt(value.substring(1), 16);
  }
  if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'].includes(value[0])) {
    return Number.parseInt(value);
  }
  return null;
}

export function isASCII(value: string): boolean {
  return /^[\x00-\x7F]*$/.test(value);
}

export function memoryDebugInfo(memoryDump: MemoryDump, addrToSource: { [key: number]: number }, source: ParsedSource): [string, string, string, string[]][] {
  return memoryDump.map((line) => {
    const [addr, value] = line;
    const sourceIndex = addrToSource[addr];
    const asciiChar = isASCII(String.fromCharCode(value)) ? escape(String.fromCharCode(value)) : '';
    return [toWordHex(addr), toWordHex(value), asciiChar, sourceIndex ? source[sourceIndex] : null || []];
  });
}
