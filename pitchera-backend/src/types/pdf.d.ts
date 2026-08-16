// global.d.ts — only if tsc reports pdf-parse type errors
declare module 'pdf-parse' {
  function pdfParse(
    dataBuffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<{
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: unknown;
  }>;
  export = pdfParse;
}