import { useSyncExternalStore } from 'react';

/**
 * Hvor mange pixels tastaturet dækker af skærmen på mobil-web.
 *
 * Browseren skruer ikke ned for `window.innerHeight` når tastaturet glider op (den krymper kun den
 * VISUELLE viewport), så layoutet aner det ikke. `visualViewport` er den eneste kilde til det —
 * derfor et eksternt abonnement frem for state: værdien lever uden for React.
 *
 * Formlen dækker begge opførsler: krymper browseren layout-viewporten med (nogle Android-udgaver),
 * går differencen mod nul af sig selv, og vi lægger ikke luft til noget der allerede er gjort plads.
 */
let overlap = 0;
const listeners = new Set<() => void>();

function measure(): number {
  const vv = typeof window === 'undefined' ? undefined : window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

function handleChange() {
  const next = measure();
  if (next === overlap) return;
  overlap = next;
  for (const listener of listeners) listener();
  if (next > 0) {
    // Feltet var allerede fokuseret DA tastaturet kom frem, så browseren scroller det ikke frem
    // igen af sig selv. Vent til pladsen i bunden er malet, og hent så feltet op.
    requestAnimationFrame(() => {
      const el = document.activeElement;
      if (el instanceof HTMLElement) el.scrollIntoView({ block: 'center' });
    });
  }
}

function subscribe(listener: () => void): () => void {
  const vv = typeof window === 'undefined' ? undefined : window.visualViewport;
  listeners.add(listener);
  if (vv && listeners.size === 1) {
    vv.addEventListener('resize', handleChange);
    vv.addEventListener('scroll', handleChange);
  }
  return () => {
    listeners.delete(listener);
    if (vv && listeners.size === 0) {
      vv.removeEventListener('resize', handleChange);
      vv.removeEventListener('scroll', handleChange);
    }
  };
}

/** Antal pixels der skal holdes fri i bunden, for at tastaturet ikke dækker indholdet. */
export function useKeyboardOverlap(): number {
  // Serverens snapshot er 0: siden præ-renderes i Node, hvor der hverken er vindue eller tastatur.
  return useSyncExternalStore(subscribe, () => overlap, () => 0);
}
