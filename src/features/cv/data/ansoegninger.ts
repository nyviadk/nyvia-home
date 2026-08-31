import { notify } from '@/lib/toast/notify';
import type { CvOverrides } from '../render/render-doc';
import type { CvSelection } from '../selection/selection';
import { DEFAULT_BRAND, type CvAnsoegningInput } from '../types';
import { ansoegningerRepo } from './cv-repos';

/**
 * Gemte ansøgninger — hvad blev sendt til hvem, og hvornår.
 *
 * Hele grunden til at de gemmes: om et halvt år skal man kunne se præcis hvad man sendte.
 * Derfor gemmes selectionen som RÅ streng og ikke som et parset objekt — det der står i
 * arkivet er byte for byte det man indsatte, ikke appens fortolkning af det.
 *
 * Skrives i det øjeblik valideringen går igennem, ikke ved print. Objektet findes allerede
 * dér, det er ét kald, og et CV man kiggede på men ikke printede, er stadig et man har
 * arbejdet på.
 */

/** Datoen kommer fra selectionen, ikke fra uret — det er dén dag ansøgningen gælder. */
const dagFra = (sel: CvSelection): string => {
  const d = sel.job.dato.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
};

export function ansoegningFra(sel: CvSelection, raw: string): CvAnsoegningInput {
  return {
    firma: sel.job.firma.trim(),
    titel: sel.job.titel.trim() || sel.titel.trim(),
    dato: dagFra(sel),
    sprog: sel.sprog,
    selection: raw,
    brandfarve: sel.brandfarve ?? DEFAULT_BRAND,
  };
}

/** Opret. Returnerer id'et, så rettelser bagefter kan lægges på den samme ansøgning. */
export async function gemAnsoegning(sel: CvSelection, raw: string): Promise<string> {
  const id = await ansoegningerRepo.create(ansoegningFra(sel, raw));
  notify('Ansøgning gemt i arkivet');
  return id;
}

/**
 * Læg håndrettelserne på en gemt ansøgning.
 *
 * Tavst (`toast: null`): det sker mens man retter i felterne, og en kvittering pr. felt
 * ville stå og blinke uafbrudt. Fejler skrivningen, siger `patch` selv fra.
 */
export function gemRettelser(id: string, rettelser: CvOverrides): Promise<void> {
  return ansoegningerRepo.patch(id, { rettelser: JSON.stringify(rettelser) }, null);
}

/** Læs rettelserne tilbage. Kaster aldrig — et ødelagt felt må ikke spærre for arkivet. */
export function laesRettelser(raw: string | undefined): CvOverrides {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as CvOverrides) : {};
  } catch {
    return {};
  }
}
