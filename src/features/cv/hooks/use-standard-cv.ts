import { saveCvStandard } from '../data/cv-repos';
import { useCvStandard } from '../data/cv-stores';
import { selectionTilJson, standardSelection } from '../selection/edit-selection';

/**
 * Standard-CV'et: dét man starter fra når intet særligt taler imod det.
 *
 * Det RETTES ved at bygge det CV man vil starte fra næste gang og gemme det. Der er ingen
 * separat editor — den ville være en tredje kopi af det samme tekstfelt, og så ville der
 * være to steder at rette det samme.
 */
export function useStandardCv() {
  const selection = useCvStandard((s) => s.selection);
  const loading = useCvStandard((s) => s.loading);

  return {
    /**
     * ⚠️ Skærmen SKAL vente på denne før `tekst()` kaldes.
     *
     * En tom butik i det første halve sekund ligner "ingen standard gemt", og så ville et
     * tryk indsætte appens udgangspunkt oven i brugerens eget.
     */
    loading,
    harEgen: selection.trim().length > 0,
    /** Det gemte — eller appens udgangspunkt hvis der ikke er gemt et endnu. */
    tekst: () => selection || selectionTilJson(standardSelection()),
    gem: (t: string) => void saveCvStandard(t).catch(() => undefined),
  };
}
