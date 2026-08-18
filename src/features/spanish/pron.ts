import type { SpeechAccent } from '@/lib/speech/accent';

/**
 * Udtale-feltet må gerne indeholde BEGGE accenter på formen
 *
 *   Spanien: gra-thi-as / Latinam.: gra-si-as
 *
 * fordi c foran e/i og z er de eneste steder de to varianter for alvor skiller. Men på
 * skærmen skal der kun stå den ene: man har valgt en stemme, og den anden udtale er støj
 * man alligevel ikke skal læse højt.
 *
 * Opdelingen bor i visningen og ikke i datamodellen. To felter i formularen ville betyde to
 * felter at udfylde for hver eneste glose — også de fire femtedele hvor der ikke ER nogen
 * forskel — og indsæt-formatet skulle have to parenteser pr. linje.
 */
export interface AccentPron {
  /** Udtalen der passer til den valgte accent — eller hele strengen hvis der kun er én. */
  text: string;
  /** Sat KUN når posten faktisk lyder forskelligt. Ellers ville etiketten være en løgn. */
  accentLabel?: string;
}

/**
 * Ét anker-fast regex frem for at splitte på "/": en udtale kan selv indeholde skråstreg
 * (`sim-pa-ti-ko/ka`), og en splitning ville hugge den midt over. Her skal etiketten stå
 * lige efter skråstregen, ellers matcher det slet ikke, og vi falder tilbage til at vise
 * teksten som den er.
 */
const BOTH =
  /^\s*(?:spanien|spain|es-es)\s*:\s*(.+?)\s*\/\s*(?:latinam\.?|latinamerika|latam|es-mx|mexico)\s*:\s*(.+?)\s*$/i;

export function pronForAccent(pron: string, accent: SpeechAccent): AccentPron {
  const match = BOTH.exec(pron);
  if (!match) return { text: pron };
  return accent === 'es-ES'
    ? { text: match[1], accentLabel: 'Spanien' }
    : { text: match[2], accentLabel: 'Latinamerika' };
}
