import { isCipher, type EviAnswers, type EviCipher, type EviField } from './types';

export type ReuseValue =
  | { key: string; label: string; kind: 'text'; value: string }
  | { key: string; label: string; kind: 'sensitive'; cipher: EviCipher };

/**
 * Saml genbrugelige værdier fra KILDE-felter (dem med `reuseKey`). Tekst-felter giver en
 * kopiér-værdi direkte; følsomme felter giver en krypteret kilde, som chippen kan
 * dekryptere+kopiere (kræver oplåst boks). Bruges til "kopier-frem", så en værdi indtastet
 * tidligere (mail, repo, domæne, tokens) kan kopieres ved et senere felt uden at scrolle op.
 */
export function collectReuseValues(
  fields: EviField[],
  answers: EviAnswers,
): Map<string, ReuseValue> {
  const out = new Map<string, ReuseValue>();
  for (const f of fields) {
    if (!f.reuseKey) continue;
    const v = answers[f.id];
    if (f.type === 'sensitive') {
      if (isCipher(v)) {
        out.set(f.reuseKey, { key: f.reuseKey, label: f.label, kind: 'sensitive', cipher: v });
      }
    } else if (typeof v === 'string' && v.trim() !== '') {
      out.set(f.reuseKey, { key: f.reuseKey, label: f.label, kind: 'text', value: v });
    }
  }
  return out;
}
