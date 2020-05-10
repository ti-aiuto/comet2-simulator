import { isASCII } from "./utils";

export type InputFunction = () => Promise<string>;
export type OutputFunction = (value: string) => Promise<void>

export class IO {
  constructor(
    private inputFunction: InputFunction,
    private outputFunction: OutputFunction
  ) {
  }

  async in(): Promise<string> {
    const value = await this.inputFunction();
    if (!isASCII(value)) {
      throw new Error(`不正な入力 ${value}`);
    }
    return value;
  }

  out(value: string): Promise<void> {
    return this.outputFunction(value);
  }
}
