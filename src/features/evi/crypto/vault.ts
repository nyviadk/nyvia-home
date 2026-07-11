/**
 * Default/native-stub for den følsomme "boks". Følsomme felter (fx kundens Prismic-
 * password) dekrypteres KUN på web — native importerer aldrig Web Crypto-implementeringen.
 * Signaturerne matcher `vault.web.ts`, så vault-store kan compile på begge platforme;
 * kaldes de på native, kaster de (UI skjuler følsomme felter der).
 */
import type { EviCipher, EviVaultConfig } from '../types';

export const vaultAvailable = false;

const ERR = 'Følsomme felter er kun tilgængelige på web.';

export interface CreatedVault {
  config: EviVaultConfig;
  dek: CryptoKey;
}

export class WrongPassphraseError extends Error {
  constructor() {
    super('Forkert adgangssætning');
    this.name = 'WrongPassphraseError';
  }
}

export async function createVault(_passphrase: string): Promise<CreatedVault> {
  throw new Error(ERR);
}

export async function unlockVault(
  _passphrase: string,
  _config: EviVaultConfig,
): Promise<CryptoKey> {
  throw new Error(ERR);
}

export async function rewrapVault(
  _oldPassphrase: string,
  _newPassphrase: string,
  _config: EviVaultConfig,
): Promise<EviVaultConfig> {
  throw new Error(ERR);
}

export async function encryptField(_dek: CryptoKey, _plaintext: string): Promise<EviCipher> {
  throw new Error(ERR);
}

export async function decryptField(_dek: CryptoKey, _cipher: EviCipher): Promise<string> {
  throw new Error(ERR);
}
