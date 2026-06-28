import { stableHashHex } from '@/lib/hash';
import type { RawTransaction } from './csv';

/**
 * Deterministisk dokument-id for en transaktion. Bygget på felter der er stabile
 * mellem eksporter — inkl. `balanceOre` (den løbende saldo gør ellers ens rækker
 * unikke) og den RÅ tekst (uberørt af rense-regler, så id'et ikke skifter når man
 * tilføjer/ændrer regler). Samme reelle transaktion → samme id → ingen dubletter.
 */
export function transactionId(r: RawTransaction): string {
  return stableHashHex(
    [r.account, r.date, r.amountOre, r.balanceOre ?? '', r.text].join('|')
  );
}
