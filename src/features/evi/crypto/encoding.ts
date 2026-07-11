/**
 * Små base64/UTF-8-hjælpere til krypto-laget. Kun importeret fra `vault.web.ts`
 * (browser), så `btoa`/`atob`/`TextEncoder` er altid tilgængelige her.
 */

export function utf8ToBytes(s: string): Uint8Array<ArrayBuffer> {
  // Kopiér til en frisk ArrayBuffer-baseret buffer (TextEncoder returnerer den løsere
  // ArrayBufferLike-variant, som Web Crypto's BufferSource-typer ikke accepterer).
  const encoded = new TextEncoder().encode(s);
  const out = new Uint8Array(encoded.length);
  out.set(encoded);
  return out;
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
