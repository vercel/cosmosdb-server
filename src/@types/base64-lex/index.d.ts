declare module "base64-lex" {
  function encode(input: string | number[] | Buffer | ArrayBuffer): string;
  function decode(input: string): string | number[] | Buffer | ArrayBuffer;
}
