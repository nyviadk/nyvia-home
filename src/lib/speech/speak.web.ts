import { normalizeLang, type SpeechAccent, type SpeechVoiceInfo } from './accent';

/** Browserens indbyggede Web Speech API — ingen ekstra pakke. */
const synth = (): SpeechSynthesis | undefined =>
  typeof window === 'undefined' ? undefined : window.speechSynthesis;

export function listVoices(): Promise<SpeechVoiceInfo[]> {
  const voices = synth()?.getVoices() ?? [];
  return Promise.resolve(
    voices
      .filter((v) => normalizeLang(v.lang).startsWith('es'))
      .map((v) => ({ id: v.voiceURI, name: v.name, lang: normalizeLang(v.lang) }))
  );
}

/**
 * Chrome fylder stemmelisten ASYNKRONT: `getVoices()` er tom ved første kald og udfyldes
 * først når `voiceschanged` fyrer. Uden dette abonnement ville stemme-oversigten stå tom
 * ved første indlæsning — og oplæsningen falde tilbage til browserens standardstemme.
 */
export function subscribeVoices(onChange: () => void): () => void {
  const s = synth();
  if (!s) return () => {};
  s.addEventListener('voiceschanged', onChange);
  return () => s.removeEventListener('voiceschanged', onChange);
}

export function speak(text: string, accent: SpeechAccent, voiceId?: string): void {
  const s = synth();
  if (!s) return;
  s.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent;
  utterance.rate = 0.9;
  const voice = voiceId ? s.getVoices().find((v) => v.voiceURI === voiceId) : undefined;
  if (voice) utterance.voice = voice;
  s.speak(utterance);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}
