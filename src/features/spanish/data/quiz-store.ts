import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { SpeechAccent } from '@/lib/speech/accent';
import { persistOptions } from '@/lib/storage/persist-options';
import type { QuizDirection, SpanishKind } from '../types';

/** 'alle' = test på tværs af ord, sætninger og regler. */
export type KindFilter = SpanishKind | 'alle';

interface QuizState {
  accent: SpeechAccent;
  direction: QuizDirection;
  kind: KindFilter;
  /** Resterende kort i den igangværende runde (blandet rækkefølge). Tom = ingen runde. */
  queue: string[];
  /**
   * Rundens frø. Ved 'blandet' udledes hvert korts retning af `hash(id + seed)`.
   *
   * Retningen kan ikke slås op på id'et alene: så ville det samme ord ligge fast som
   * dansk→spansk i al fremtid, og "blandet" ville bare være en éngangsfordeling. Den kan
   * heller ikke være `Math.random()` under render, for så skiftede spørgsmålet side hver
   * gang man tastede et bogstav. Frøet er svaret på begge dele — nyt pr. runde, konstant
   * inde i runden.
   */
  seed: number;
  /**
   * Kort man har svaret forkert på, og som endnu ikke er svaret rigtigt i denne runde.
   *
   * Bruges til to ting: at vide at kortet er en genganger (så det ikke tælles i scoren igen),
   * og at kunne vise hvor mange der venter — ellers ville runden se ud til at gå i stå.
   */
  retry: string[];
  /**
   * Tæller ét op for hvert kort man går videre fra. Bruges alene som `key` på kortet.
   *
   * Uden den kunne et kort ikke komme igen umiddelbart efter sig selv: er en genganger det
   * sidste tilbage i køen, er `current.id` den samme før og efter, React genbruger
   * komponenten, og svarfelt, hint og facit-tilstand ville stå tilbage fra forrige forsøg.
   */
  step: number;
  /** Antal FORSKELLIGE kort i runden. Gengangere øger den ikke. */
  roundTotal: number;
  correct: number;
  wrong: number;
}

/**
 * Testens tilstand. Lokal — intet af dette hører hjemme i Firestore.
 *
 * `queue` PERSISTERES med vilje: lukker man appen midt i en runde, fortsætter man hvor man
 * slap i stedet for at starte forfra. Det er også dét, der giver dækning — hvert kort ligger
 * præcis én gang i bunken, så alle er igennem før der blandes på ny. En ren
 * "vælg et tilfældigt kort"-løsning ville vise nogle kort tre gange og andre aldrig.
 */
export const useQuizStore = create<QuizState>()(
  persist(
    () => ({
      accent: 'es-ES' as SpeechAccent,
      direction: 'mixed' as QuizDirection,
      kind: 'alle' as KindFilter,
      queue: [] as string[],
      seed: 0,
      retry: [] as string[],
      step: 0,
      roundTotal: 0,
      correct: 0,
      wrong: 0,
    }),
    persistOptions<QuizState>('spanish-quiz', [
      'accent',
      'direction',
      'kind',
      'queue',
      // Frøet persisteres sammen med køen: genoptager man en runde efter en genstart, skal
      // kortene vende som da man forlod dem.
      'seed',
      'retry',
      'step',
      'roundTotal',
      'correct',
      'wrong',
    ])
  )
);

export const setAccent = (accent: SpeechAccent) => useQuizStore.setState({ accent });
export const setDirection = (direction: QuizDirection) => useQuizStore.setState({ direction });
export const setKindFilter = (kind: KindFilter) => useQuizStore.setState({ kind });

/** Fisher-Yates. Muterer kopien, ikke input. */
function shuffled<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Start en ny runde over de givne kort. */
export function startRound(ids: readonly string[]): void {
  const queue = shuffled(ids);
  useQuizStore.setState({
    queue,
    // Trækkes her — i en hændelse, ikke under render — så retningerne fordeles på ny hver
    // eneste runde. `|| 1`: et frø på 0 ville lade hash(id + seed) falde tilbage til det
    // rene id-hash, altså præcis den faste fordeling frøet findes for at bryde.
    seed: Math.floor(Math.random() * 1_000_000) || 1,
    retry: [],
    step: 0,
    roundTotal: queue.length,
    correct: 0,
    wrong: 0,
  });
}

/**
 * Gå videre. `result` er undefined for regler, som ikke scores.
 *
 * Et forkert kort forlader ikke runden — det ryger BAGERST i køen og kommer igen. Forrest
 * ville være meningsløst: så svarede man bare efter facit man lige havde set. Bagerst er der
 * de andre kort imellem, og man skal faktisk kunne det for at komme videre.
 *
 * Kortet fjernes altid på ID og ikke med `slice(1)`: slettes en post midt i en runde, ligger
 * dens id stadig i køen, og en blind `slice` ville så fjerne det forkerte kort.
 */
export function advance(id: string, result?: 'correct' | 'wrong'): void {
  useQuizStore.setState((s) => {
    const rest = s.queue.filter((q) => q !== id);
    // Kortet har været forkert tidligere i runden — så er det en genganger.
    const isRetry = s.retry.includes(id);

    if (result === 'wrong') {
      return {
        queue: [...rest, id],
        step: s.step + 1,
        retry: isRetry ? s.retry : [...s.retry, id],
        // Kun første fejl tælles. Ellers ville ét kort man kæmpede med tre gange fylde tre
        // fejl i resultatet, og `correct + wrong` kunne overstige antallet af kort i runden.
        wrong: s.wrong + (isRetry ? 0 : 1),
        correct: s.correct,
      };
    }

    return {
      queue: rest,
      step: s.step + 1,
      retry: isRetry ? s.retry.filter((r) => r !== id) : s.retry,
      wrong: s.wrong,
      // En genganger man endelig får rigtig tælles ikke som rigtig: den er allerede talt som
      // fejl, og at flytte den over ville skjule at man ikke kunne den i første forsøg.
      correct: s.correct + (result === 'correct' && !isRetry ? 1 : 0),
    };
  });
}

export const endRound = () =>
  useQuizStore.setState({ queue: [], retry: [], step: 0, roundTotal: 0 });
