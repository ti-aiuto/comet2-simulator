export type InputFunction = () => Promise<string>;
export type OutputFunction = (value: string) => Promise<void>

export class IO {
  constructor(
    private inputFunction: InputFunction,
    private outputFunction: OutputFunction
  ) {
  }

  in(): Promise<string> {
    return this.inputFunction();
  }

  out(value: string): Promise<void> {
    return this.outputFunction(value);
  }
}
