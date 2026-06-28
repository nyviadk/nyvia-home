/** Native-stub: CSV-import er kun tilgængelig på web (browser-fillæsning). */
export async function pickAndReadCsv(): Promise<{ name: string; content: string } | null> {
  throw new Error('CSV-import er kun tilgængelig på web');
}
