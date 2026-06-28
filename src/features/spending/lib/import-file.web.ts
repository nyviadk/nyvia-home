/**
 * Web-only fil-valg + indlæsning. Filen læses lokalt i browseren (ingen netværk).
 * Håndterer dansk tegnsætning: UTF-8 (m./u. BOM), ellers fallback til Windows-1252,
 * som Nykredit typisk eksporterer i (æ/ø/å).
 */
export async function pickAndReadCsv(): Promise<{ name: string; content: string } | null> {
  const file = await pickFile();
  if (!file) return null;
  return { name: file.name, content: await decode(file) };
}

function pickFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt,text/csv,text/plain';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

async function decode(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3));
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}
