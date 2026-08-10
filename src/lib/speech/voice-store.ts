import { create } from 'zustand';

import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { pickVoice, type SpeechAccent, type SpeechVoiceInfo } from './accent';
import { listVoices, subscribeVoices } from './speak';

/**
 * Enhedens spanske stemmer. Hentes ÉN gang ved modul-init og opdateres når platformen
 * melder om ændringer — ikke via `useState`+`useEffect` i en komponent, jf. projekt-reglen
 * om eksterne kilder.
 *
 * `loaded` skelner "har ikke spurgt endnu" fra "spurgte, og der var ingen": kun det sidste
 * skal give en advarsel i UI'et.
 */
export const useVoiceStore = create<{ voices: SpeechVoiceInfo[]; loaded: boolean }>(() => ({
  voices: [],
  loaded: false,
}));

const refresh = async () => {
  const voices = await listVoices();
  useVoiceStore.setState({ voices, loaded: true });
};

hotReloadSubscribe('nyvia.speech-voices', () => {
  void refresh();
  return subscribeVoices(() => void refresh());
});

/** Den stemme der FAKTISK bruges for en accent — samme opslag som ved oplæsning. */
export function useResolvedVoice(accent: SpeechAccent): SpeechVoiceInfo | undefined {
  return pickVoice(
    useVoiceStore((s) => s.voices),
    accent
  );
}
