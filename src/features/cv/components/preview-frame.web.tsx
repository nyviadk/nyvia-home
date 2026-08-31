import { useCallback, useState } from 'react';

/**
 * Værten for print-iframen, skaleret så en A4-side passer i kolonnen.
 *
 * ⚠️ `transform: scale()` sidder på en YDRE beholder, ikke på iframens indhold. Det ændrer
 * kun hvor stort billedet males — layoutet inde i iframen er stadig 210 mm bredt, og det er
 * derfor målingen holder. Skalerede vi indholdet, ville vi måle noget andet end vi printer.
 *
 * Skalaen MÅLES frem for at være et fast tal: et fast 0,62 efterlod en halvtom hvid kasse på
 * en bred skærm og skar siden af på en smal. Bredden kommer fra beholderen selv.
 */

/** A4 i millimeter. Bruges kun til at regne skalaen ud, ikke til layout. */
const A4_BREDDE_MM = 210;
/** To sider plus mellemrummet mellem dem (se `@media screen` i print-CSS'en). */
const HOEJDE_MM = 297 * 2 + 8;

export function PreviewFrame({
  hostRef,
}: {
  hostRef: (el: HTMLDivElement | null) => void;
}) {
  const [bredde, setBredde] = useState(0);

  /**
   * Beholderens bredde måles med en ResizeObserver frem for `useEffect` + window-lytter:
   * den fanger også når sidepanelet åbner eller kolonnen ændrer sig uden at vinduet gør.
   * Ref-callbacken er stabil, ellers ville observeren blive koblet af og på ved hver render.
   */
  const maalRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setBredde(el.clientWidth);
    const ro = new ResizeObserver(([post]) => setBredde(post.contentRect.width));
    ro.observe(el);
  }, []);

  // 1 mm i CSS-px ved 96 dpi. Kun til skalaen — det printede måles i selve dokumentet.
  const pxPrMm = 96 / 25.4;
  const skala = bredde > 0 ? Math.min(1, bredde / (A4_BREDDE_MM * pxPrMm)) : 0;

  return (
    <div ref={maalRef} style={{ width: '100%' }}>
      <div
        style={{
          /* Præcis så bred som den skalerede side — ikke 100 %.
             Med fuld bredde stak beholderens bund ud til højre for papiret som en brun
             bjælke, fordi skalaen aldrig går over 1. Baggrunden hører til inde i iframen,
             hvor den følger papiret. */
          width: skala ? `calc(${A4_BREDDE_MM}mm * ${skala})` : '100%',
          height: skala ? `calc(${HOEJDE_MM}mm * ${skala})` : 0,
          overflow: 'hidden',
          borderRadius: 8,
        }}>
        <div
          ref={hostRef}
          style={{
            transform: `scale(${skala})`,
            transformOrigin: 'top left',
            width: `${A4_BREDDE_MM}mm`,
            // Skjult indtil bredden er målt: ellers ses et frame i fuld størrelse der
            // hopper på plads.
            visibility: skala ? 'visible' : 'hidden',
          }}
        />
      </div>
    </div>
  );
}
