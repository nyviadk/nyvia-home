import * as Speech from 'expo-speech';

import { normalizeLang, type SpeechAccent, type SpeechVoiceInfo } from './accent';

/** Alle spanske stemmer der er installeret på enheden. */
export async function listVoices(): Promise<SpeechVoiceInfo[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices
    .filter((v) => normalizeLang(v.language).startsWith('es'))
    .map((v) => ({ id: v.identifier, name: v.name, lang: normalizeLang(v.language) }));
}

/**
 * No-op på native: listen er komplet med det samme. Kun web indlæser stemmer asynkront og
 * har brug for at melde tilbage — signaturen holdes ens, så kalderen ikke skal kende
 * platformen.
 */
export function subscribeVoices(_onChange: () => void): () => void {
  return () => {};
}

/**
 * Læser teksten højt. Afbryder en igangværende oplæsning, så hurtige tryk ikke stables.
 *
 * `voiceId` sendes med når den er kendt: kun `language` ville lade Android vælge stemme i
 * det skjulte, og så kunne skærmen vise én stemme mens en anden blev brugt.
 */
export function speak(text: string, accent: SpeechAccent, voiceId?: string): void {
  Speech.stop();
  Speech.speak(text, {
    language: accent,
    ...(voiceId ? { voice: voiceId } : {}),
    rate: 0.9,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
