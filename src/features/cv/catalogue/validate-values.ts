import { issue, type CvIssue } from '../issues';
import type { CvSnapshot } from '../data/catalogue-io';
import { emptyValue, isFieldBlank, type CvFieldSpec, type FieldValues } from './field-spec';

/**
 * Kontrollér én posts felter før den skrives.
 *
 * Samler ALLE fejl og stopper aldrig ved den første — retter man én ad gangen, gemmer man
 * fem gange og finder en ny fejl hver gang.
 *
 * Reglen bag det hele: intet må forsvinde i tavshed. Hver gang skriveren ville udelade
 * eller omforme noget brugeren har tastet, skal der stå det her i stedet.
 *
 * `snapshot` er valgfri, fordi indstillingsskærmen ikke har nogen henvisninger. Er den
 * med, tjekkes `ref`-felter for at pege på noget der findes.
 */
export function validateValues(
  specs: readonly CvFieldSpec[],
  values: FieldValues,
  snapshot?: CvSnapshot
): CvIssue[] {
  const out: CvIssue[] = [];

  for (const spec of specs) {
    const value = values[spec.name] ?? emptyValue(spec);

    if (spec.kind !== 'bool' && spec.kind !== 'nullable' && spec.required && isFieldBlank(value)) {
      out.push(issue(spec.label, 'Skal udfyldes'));
    }

    if (spec.kind === 'number' && value.t === 'text' && value.v.trim() !== '') {
      if (!/^-?\d+([.,]\d+)?$/.test(value.v.trim())) {
        out.push(issue(spec.label, 'Skal være et tal'));
      }
    }

    /**
     * Dansk er CV'ets grundsprog og engelsk er oversættelsen. Står der kun engelsk, bliver
     * feltet TOMT i det danske CV — `T()` falder tilbage på dansk, og dansk er der ikke.
     * Det opdager man først når CV'et er printet.
     */
    if (spec.kind === 'i18n' && value.t === 'i18n' && !value.da.trim() && value.en.trim()) {
      out.push(issue(spec.label, 'Dansk mangler — feltet bliver tomt i et dansk CV'));
    }

    /**
     * En henvisning til noget der er slettet. `SelectField` viser en ukendt værdi som et
     * TOMT felt, så punktet ser ud til at mangle et job — og gemmer man, skrives den døde
     * henvisning tilbage, og punktet kan aldrig bruges i en selection igen.
     */
    if (spec.kind === 'ref' && snapshot && value.t === 'text') {
      const v = value.v.trim();
      if (v && !snapshot[spec.coll][v]) {
        out.push(issue(spec.label, `"${v}" findes ikke længere`, Object.keys(snapshot[spec.coll])));
      }
    }

    if (spec.kind === 'variants' && value.t === 'variants') {
      const seen = new Set<string>();
      for (const [i, row] of value.v.entries()) {
        const key = row.key.trim();
        const harTekst = !!(row.da.trim() || row.en.trim());
        // Helt tom række: man har trykket "Tilføj" og ikke skrevet noget endnu.
        if (!key && !harTekst) continue;
        if (!key) {
          out.push(issue(`${spec.label} · række ${i + 1}`, 'Varianten mangler et navn'));
        } else if (!harTekst) {
          out.push(issue(`${spec.label} · ${key}`, 'Varianten mangler tekst'));
        } else if (!row.da.trim()) {
          out.push(issue(`${spec.label} · ${key}`, 'Dansk mangler'));
        }
        if (key && seen.has(key)) {
          out.push(issue(`${spec.label} · ${key}`, 'Varianten findes to gange'));
        }
        if (key) seen.add(key);
      }
    }

    /**
     * Et link uden adresse er ikke et link. Uden dette tjek blev linkteksten brugt som
     * adresse, og "Min blog" endte som `https://Min blog` i et printet CV.
     */
    if (spec.kind === 'links' && value.t === 'links') {
      for (const [i, row] of value.v.entries()) {
        if (!row.url.trim() && row.tekst.trim()) {
          out.push(issue(`${spec.label} · ${row.tekst.trim()}`, 'Mangler adresse'));
        }
        if (!row.url.trim() && !row.tekst.trim() && value.v.length > 1) {
          out.push(issue(`${spec.label} · række ${i + 1}`, 'Tom — fjern den eller udfyld den'));
        }
      }
    }
  }

  return out;
}
