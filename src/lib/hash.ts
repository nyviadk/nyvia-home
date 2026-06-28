/**
 * Stabil, synkron streng-hash til deterministiske dokument-id'er. To FNV-1a-kørsler
 * med forskellige seeds sammensættes → 16 hex-tegn (64-bit), så kollisioner er
 * usandsynlige selv ved mange tusinde poster. Samme input → altid samme id.
 */
export function stableHashHex(input: string): string {
  return fnv1a(input, 0x811c9dc5) + fnv1a(input, 0x85ebca6b);
}

function fnv1a(str: string, seed: number): string {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
