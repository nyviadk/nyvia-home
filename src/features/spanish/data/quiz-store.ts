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
      roundTotal: 0,
      correct: 0,
      wrong: 0,
    }),
    persistOptions<QuizState>('spanish-quiz', [
      'accent',
      'direction',
      'kind',
      'queue',
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
  useQuizStore.setState({ queue, roundTotal: queue.length, correct: 0, wrong: 0 });
}

/**
 * Gå videre. `result` er undefined for regler, som ikke scores.
 *
 * Fjerner kortet på ID og ikke med `slice(1)`: slettes en post midt i en runde, ligger dens
 * id stadig i køen, og en blind `slice` ville så fjerne det forkerte kort.
 */
export function advance(id: string, result?: 'correct' | 'wrong'): void {
  useQuizStore.setState((s) => ({
    queue: s.queue.filter((q) => q !== id),
    correct: s.correct + (result === 'correct' ? 1 : 0),
    wrong: s.wrong + (result === 'wrong' ? 1 : 0),
  }));
}

export const endRound = () => useQuizStore.setState({ queue: [], roundTotal: 0 });
