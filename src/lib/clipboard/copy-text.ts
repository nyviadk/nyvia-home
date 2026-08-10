import * as Clipboard from 'expo-clipboard';

import { notify } from '@/lib/toast/notify';

/**
 * Kopiér tekst til udklipsholderen og kvittér med en toast.
 *
 * Lå før håndskrevet seks steder som `navigator.clipboard.writeText(…)` bag et
 * `typeof navigator !== 'undefined' && navigator.clipboard`-tjek. React Native definerer
 * et globalt `navigator` UDEN `clipboard`, så den gren var altid falsk på native — de fire
 * kopiér-knapper i web-only features mærkede det aldrig, men delelinket i ønskelisten og
 * kontonumrene i Hjem gjorde ingenting på Android. `expo-clipboard` dækker begge platforme
 * (web via AsyncClipboard), så feature-detektionen er ikke længere nødvendig.
 */
export async function copyText(text: string, message = 'Kopieret'): Promise<boolean> {
  // setStringAsync KASTER ikke ved afvisning — den returnerer false. Web kan nægte uden en
  // bruger-gestus eller uden for et sikkert domæne, og `toastAfter` ville i det tilfælde
  // kvittere med "Kopieret" for noget der ikke skete. Derfor tjekkes returværdien.
  const ok = await Clipboard.setStringAsync(text).catch(() => false);
  notify(ok ? message : 'Kunne ikke kopiere');
  return ok;
}
