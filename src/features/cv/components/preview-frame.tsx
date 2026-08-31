/**
 * Native-stub. Forhåndsvisningen er en iframe, og den findes kun på web.
 *
 * Skærmen når aldrig hertil (ruten viser `WebOnlyScreen` på native), men filen skal findes
 * for at importen kan resolves — og signaturen skal matche web-udgaven, for tsc typetjekker
 * mod DENNE fil.
 */
export function PreviewFrame(_props: { hostRef: (el: HTMLDivElement | null) => void }) {
  return null;
}
