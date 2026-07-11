/**
 * Evi = kunde-CRM som en "Home"-sektion. Modellen er bevidst delt i to:
 *
 *  - Én genbrugelig SKABELON (felt-definitioner) — `EviTemplate`.
 *  - Én SUBMISSION pr. kunde der kun gemmer `feltId → værdi` — `EviCustomer`.
 *
 * Fordi kunder kun refererer felter via stabile id'er, slår en ændring af et felt
 * (label, beskrivelse, rækkefølge …) automatisk igennem på ALLE tidligere kunder,
 * og nye/fjernede felter er bagudkompatible (gamle svar bevares, ukendte felter tomme).
 */

export type EviFieldType =
  | 'text' // enkelt-linje tekst
  | 'longtext' // fler-linje tekst / noter
  | 'date' // ÅÅÅÅ-MM-DD
  | 'checkbox' // enkelt ja/nej
  | 'checklist' // flere uafhængige valg (afløser Notions "vælg så mange")
  | 'choice' // præcis ét valg
  | 'sensitive'; // krypteret klientside, kun web

/** Fri-tekst beskrivelse under et felt, med valgfrit link (kan tilføjes/fjernes). */
export interface EviDescription {
  text: string;
  /** Hvis sat vises teksten som et link; fjernes href → ren tekst. */
  href?: string;
}

export interface EviField {
  /** Stabilt id (genId) — ændres ALDRIG, så kunde-svar bevarer deres reference. */
  id: string;
  label: string;
  type: EviFieldType;
  description?: EviDescription;
  /** Valgmuligheder for `checklist` / `choice`. */
  options?: string[];
  /** Valgfri kommando/URL der vises som monospace-blok med kopiér-knap. */
  command?: string;
  /** Valgfri sektions-overskrift i submission-visningen (gruppering). */
  section?: string;
  /** Vises i nøgle-kortet øverst på kunden (vigtigste info). */
  pinned?: boolean;
  /** Dette felt er KILDE til en genbrugelig værdi (fx mail, repo-navn). */
  reuseKey?: string;
  /** Vis kopiér-genveje til disse `reuseKey`-kilder ved dette felt (kopier-frem). */
  showReuse?: string[];
  /** Arkiveret: skjules i UI, men gamle svar bevares (ingen datatab). */
  archived?: boolean;
}

// type-alias (ikke interface) → tildelbar til Record<string, unknown> for db-facaden.
export type EviTemplate = {
  fields: EviField[];
  updatedAt: string;
};

/** AES-256-GCM ciffertekst (base64) + iv (base64). Kun web kan dekryptere. */
export interface EviCipher {
  ct: string;
  iv: string;
}

/** En værdi kan være tekst, dato-streng, flueben, flere valg — eller krypteret. */
export type EviAnswerValue = string | string[] | boolean | EviCipher;

export type EviAnswers = Record<string, EviAnswerValue>;

export type EviCustomer = {
  /** Eneste påkrævede felt = submission-titel. */
  companyName: string;
  answers: EviAnswers;
  createdAt: string;
  updatedAt: string;
};

/**
 * Envelope-metadata for den følsomme "boks". Kun ciffertekst + salt gemmes — aldrig
 * passphrasen eller data-nøglen (DEK) i klartekst. En tilfældig DEK krypterer felterne
 * og gemmes selv wrapped (krypteret med en passphrase-afledt KEK), så adgangssætningen
 * kan skiftes / migreres uden at om-kryptere alle felter.
 */
export type EviVaultConfig = {
  v: 1;
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  /** base64 salt til KDF'en. */
  salt: string;
  /** DEK krypteret med KEK (passphrase-afledt). */
  wrappedDEK: EviCipher;
  createdAt: string;
};

/** Type-guard: er en gemt svar-værdi en krypteret (følsom) værdi? */
export function isCipher(value: EviAnswerValue | undefined): value is EviCipher {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as EviCipher).ct === 'string' &&
    typeof (value as EviCipher).iv === 'string'
  );
}
