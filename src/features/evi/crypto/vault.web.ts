/**
 * Web-implementering af den følsomme "boks" (client-side kryptering via Web Crypto).
 *
 * Envelope-model: en tilfældig 256-bit DATA-nøgle (DEK) krypterer felterne (AES-256-GCM).
 * DEK'en gemmes selv *wrapped* — krypteret med en KEK der udledes fra brugerens passphrase
 * (PBKDF2-SHA-256). Passphrasen og DEK'en gemmes ALDRIG; kun ciffertekst + salt lander i
 * Firestore. Fordele: intet hemmeligt i det (offentlige) web-bundt, portabelt til en ny
 * bærbar (bare tast passphrasen), og skift-passphrase/migrering = re-wrap DEK (ingen
 * om-kryptering af alle felter).
 */
import { nowISO } from '@/lib/datetime';
import type { EviCipher, EviVaultConfig } from '../types';
import { base64ToBytes, bytesToBase64, bytesToUtf8, utf8ToBytes } from './encoding';

const ALGO = 'AES-GCM';
const KDF = 'PBKDF2';
const HASH = 'SHA-256';
// OWASP-anbefaling (PBKDF2-HMAC-SHA256): gør offline brute-force dyrt. Køres kun ved
// opsætning/lås-op (~0,3–0,6 s), ikke pr. felt. Gemmes i config → kan hæves bagudkompatibelt.
const ITERATIONS = 600_000;

export const vaultAvailable = true;

export class WrongPassphraseError extends Error {
  constructor() {
    super('Forkert adgangssætning');
    this.name = 'WrongPassphraseError';
  }
}

function subtle(): SubtleCrypto {
  return crypto.subtle;
}

/** Udled KEK (til at wrappe/unwrappe DEK) fra passphrase + salt. */
async function deriveKEK(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const base = await subtle().importKey('raw', utf8ToBytes(passphrase), KDF, false, ['deriveKey']);
  return subtle().deriveKey(
    { name: KDF, salt, iterations, hash: HASH },
    base,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function aesEncrypt(key: CryptoKey, data: Uint8Array<ArrayBuffer>): Promise<EviCipher> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await subtle().encrypt({ name: ALGO, iv }, key, data);
  return { ct: bytesToBase64(new Uint8Array(buf)), iv: bytesToBase64(iv) };
}

async function aesDecrypt(key: CryptoKey, cipher: EviCipher): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await subtle().decrypt(
    { name: ALGO, iv: base64ToBytes(cipher.iv) },
    key,
    base64ToBytes(cipher.ct),
  );
  return new Uint8Array(buf);
}

/** Importér de rå DEK-bytes som en IKKE-eksporterbar nøgle (kan ikke læses ud igen). */
function importDEK(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return subtle().importKey('raw', raw, ALGO, false, ['encrypt', 'decrypt']);
}

export interface CreatedVault {
  config: EviVaultConfig;
  dek: CryptoKey;
}

/** Første gang: generér salt + tilfældig DEK, wrap DEK med KEK. Returnér config + DEK. */
export async function createVault(passphrase: string): Promise<CreatedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kek = await deriveKEK(passphrase, salt, ITERATIONS);
  const rawDEK = crypto.getRandomValues(new Uint8Array(32));
  const wrappedDEK = await aesEncrypt(kek, rawDEK);
  const dek = await importDEK(rawDEK);
  rawDEK.fill(0); // ryd de rå bytes fra hukommelsen
  return {
    config: {
      v: 1,
      kdf: KDF,
      hash: HASH,
      iterations: ITERATIONS,
      salt: bytesToBase64(salt),
      wrappedDEK,
      createdAt: nowISO(),
    },
    dek,
  };
}

/** Lås op: udled KEK, unwrap DEK. Forkert passphrase → GCM-auth fejler → WrongPassphraseError. */
export async function unlockVault(
  passphrase: string,
  config: EviVaultConfig,
): Promise<CryptoKey> {
  const kek = await deriveKEK(passphrase, base64ToBytes(config.salt), config.iterations);
  let rawDEK: Uint8Array<ArrayBuffer>;
  try {
    rawDEK = await aesDecrypt(kek, config.wrappedDEK);
  } catch {
    throw new WrongPassphraseError();
  }
  const dek = await importDEK(rawDEK);
  rawDEK.fill(0);
  return dek;
}

/** Skift passphrase: unwrap DEK med gammel, wrap igen med ny (felterne røres ikke). */
export async function rewrapVault(
  oldPassphrase: string,
  newPassphrase: string,
  config: EviVaultConfig,
): Promise<EviVaultConfig> {
  const oldKek = await deriveKEK(oldPassphrase, base64ToBytes(config.salt), config.iterations);
  let rawDEK: Uint8Array<ArrayBuffer>;
  try {
    rawDEK = await aesDecrypt(oldKek, config.wrappedDEK);
  } catch {
    throw new WrongPassphraseError();
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const newKek = await deriveKEK(newPassphrase, salt, ITERATIONS);
  const wrappedDEK = await aesEncrypt(newKek, rawDEK);
  rawDEK.fill(0);
  return { ...config, iterations: ITERATIONS, salt: bytesToBase64(salt), wrappedDEK };
}

export function encryptField(dek: CryptoKey, plaintext: string): Promise<EviCipher> {
  return aesEncrypt(dek, utf8ToBytes(plaintext));
}

export async function decryptField(dek: CryptoKey, cipher: EviCipher): Promise<string> {
  return bytesToUtf8(await aesDecrypt(dek, cipher));
}
