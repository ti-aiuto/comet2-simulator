export type MemoryAddress = number;
export type WordValue = number;
export type FlagValue = 0 | 1;

export const GENERAL_REGISTER_NAMES = Object.freeze(['GR0', 'GR1', 'GR2', 'GR3', 'GR4', 'GR5', 'GR6', 'GR7']);

export const MACHINE_INSTRUCTION_NUMBER: { [key: string]: { [key: number]: number } } = Object.freeze({
  LD: { 2: 0x10 },
  ST: { 2: 0x11 },
  CPA: { 1: 0x40 },
  JZE: { 2: 0x63 },
  JMI: { 2: 0x61 },
  SUBA: { 1: 0x25 },
  JUMP: { 2: 0x64 },
  RET: { 1: 0x81 }
});

export function toWordHex(num: number): string {
  return ('0000' + (num.toString(16))).slice(-4).toUpperCase();
}

export function parseSource(text: string): string[][] {
  return text
    .replace(/\r\n?/g, "\n")
    .trim()
    .split("\n")
    .map((line) => [...line.split("\t"), '', '', '', ''].slice(0, 5));
}
