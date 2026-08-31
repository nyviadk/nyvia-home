import { useCallback, useRef, useState } from 'react';

import { FIT_STEPS } from '../render/cv-metrics';
import { findFit, type FitResultat } from '../render/fit';
import { createCvFrame, type CvFrame } from '../render/print-frame';

/**
 * Print-rammen og auto-tilpasningen, holdt væk fra skærmens layout.
 *
 * Hooken kender ikke til CV'ets indhold: den får en BYGGER ind, `(k) => html`, og kører
 * trappen med den. Så kan rammen testes og ændres uden at røre skærmen, og skærmen kan
 * ændres uden at røre måle-maskineriet.
 */
export function useCvFrame() {
  const frame = useRef<CvFrame | null>(null);
  const [fit, setFit] = useState<FitResultat | null>(null);

  /**
   * ⚠️ `useCallback` er ikke pynt. React kalder en ref-callback med `null` og derefter med
   * elementet igen, hver gang callbackens identitet ændrer sig. Skrevet inline ville iframen
   * blive revet ned og bygget op ved HVERT tastetryk — og det færdigtegnede CV forsvandt med
   * den, uden en fejl nogen steder.
   */
  /**
   * Hvad der skal tegnes så snart rammen findes.
   *
   * Opdateres ved hver render, men LÆSES kun i ref-callbacken. Det er dét, der lader
   * skærmen tegne et gemt CV med det samme man åbner det fra arkivet — uden en effect, og
   * uden at ref-callbacken skal skifte identitet og rive iframen ned.
   */
  const vedMount = useRef<(() => void) | null>(null);

  const hostRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      frame.current?.destroy();
      frame.current = null;
      return;
    }
    if (!frame.current) {
      frame.current = createCvFrame(el);
      vedMount.current?.();
    }
  }, []);

  /**
   * Tegn dokumentet og find den største skala hvor begge sider passer.
   *
   * Hvert trin skriver dokumentet og måler. Målingen SKAL ske efter skrifterne er hentet —
   * ellers måles der i fallback-skriften og man får et `k` der ser rigtigt ud og printer tre
   * sider. `frame.write` venter på det.
   */
  const tegn = async (byg: (k: number) => string): Promise<void> => {
    const f = frame.current;
    if (!f) return;
    const r = await findFit(FIT_STEPS, async (k) => {
      await f.write(byg(k));
      return f.measure();
    });
    // Passer den ikke, bliver 96 %-udgaven stående på skærmen — man skal kunne SE hvad der er
    // for meget, ikke bare få tallet.
    if (r.passer && r.k !== FIT_STEPS[FIT_STEPS.length - 1]) await f.write(byg(r.k));
    // Markeringen sættes EFTER den sidste skrivning — et nyt dokument nulstiller body.
    f.visOverloeb(!r.passer);
    setFit(r);
  };

  return {
    hostRef,
    /** Sæt hvad der skal tegnes automatisk når rammen er klar. */
    tegnVedMount: (fn: () => void) => {
      vedMount.current = fn;
    },
    fit,
    tegn,
    /** Efter en ændring passer det målte ikke længere til det man er ved at bygge. */
    glem: () => setFit(null),
    /** Ryd både målingen OG rammen — ellers står det forrige CV stadig og lyser. */
    toem: () => {
      frame.current?.tom();
      setFit(null);
    },
    print: () => frame.current?.print(),
  };
}
