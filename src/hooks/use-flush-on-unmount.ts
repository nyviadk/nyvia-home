import { useEffect, useRef } from 'react';

/**
 * Kald `flush` når komponenten unmountes — med den NYESTE closure, ikke den fra første render.
 *
 * Bruges af felter der gemmer ved blur/debounce: blur når ikke altid at fyre når man
 * navigerer væk, så ugemte ændringer ville gå tabt. Ref'en opdateres under render, så
 * effekten kan køre med tom dependency-liste og dermed kun ved unmount.
 */
export function useFlushOnUnmount(flush: () => void): void {
  const latest = useRef(flush);
  latest.current = flush;
  useEffect(() => () => latest.current(), []);
}
