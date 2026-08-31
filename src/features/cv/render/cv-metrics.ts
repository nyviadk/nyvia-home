import type { CvStil } from '../types';

/**
 * Al aritmetik ét sted. CSS-filen interpolerer kun — den regner ikke.
 *
 * To skalafaktorer ganges på alle mål:
 *   `k`    fra auto-tilpasningen (1,0 / 0,98 / 0,96 — aldrig lavere)
 *   `luft` fra stilen, KUN på lodrette mellemrum
 *
 * At luft ikke rører skriftstørrelser er hele pointen: man strammer afstandene op uden at
 * gøre teksten mindre læselig. Ganges den på begge, får man bare et mindre CV.
 */

/** Relativ luminans efter sRGB, WCAG-formlen. */
export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Hvor mørk tekstfarven mindst skal være. Over dette er 7,4 pt versaler ulæselige. */
const MAX_TEXT_LUMINANCE = 0.3;

/**
 * Brandfarven mørknet nok til at kunne læses som tekst.
 *
 * Båndet bruger den RÅ farve — det er en flade, og der er stærk farve pointen. Men
 * sektionsoverskrifterne er 7,4 pt spærrede versaler, og en lys brandfarve som `#ffcc00`
 * forsvinder simpelthen. Kanalerne ganges ned indtil luminansen er under grænsen.
 */
export function darkenForText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#1c1a17';
  const n = parseInt(m[1], 16);
  let rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];

  // Loft på antal runder: en helt sort farve er allerede under grænsen, men en løkke uden
  // udgang er en løkke uden udgang.
  for (let i = 0; i < 40 && luminance(toHex(rgb)) > MAX_TEXT_LUMINANCE; i++) {
    rgb = rgb.map((c) => Math.round(c * 0.88));
  }
  return toHex(rgb);
}

const toHex = (rgb: number[]) =>
  `#${rgb.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('')}`;

export interface CvCssVars {
  brand: string;
  brandText: string;
  serif: string;
  sans: string;
  /** Punktstørrelser — ganget med k. */
  krop: number;
  navn: number;
  profil: number;
  lh: number;
  /** Millimeter — ganget med k og luft. */
  padTop: number;
  padSide: number;
  padBund: number;
  sek: number;
  h2: number;
  post: number;
  li: number;
  refspring: number;
  rm: number;
  baand: number;
  baand2: number;
  bm: number;
  km: number;
  pm: number;
  foto: number;
  rende: number;
  rendeGab: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Skrifterne indlejres fra `public/fonts/`, så CV'et ser ens ud uanset hvilken maskine der
 * printer. Fallback-navnene er kun en nødudgang hvis filerne ikke kan hentes — sker det,
 * ser man det på ombrydningen.
 */
export const SERIF_STACK = "'Source Serif 4', Georgia, serif";
export const SANS_STACK = "'Archivo', Helvetica, Arial, sans-serif";

export function computeCvVars(stil: CvStil, brandfarve: string, k: number): CvCssVars {
  const luft = stil.luft || 1;
  /** Skriftstørrelser: kun k. */
  const r = (v: number) => round(v * k);
  /** Lodrette mellemrum: k OG luft. */
  const a = (v: number) => round(v * k * luft);
  const base = stil.grundstoerrelse || 10;

  return {
    brand: brandfarve,
    brandText: darkenForText(brandfarve),
    serif: SERIF_STACK,
    sans: SANS_STACK,
    krop: r(base),
    navn: r(base * 2.6),
    profil: r(base * 1.1),
    lh: stil.linjeafstand || 1.55,
    padTop: a(18),
    padSide: round(17 * k),
    padBund: a(16),
    sek: a(8),
    h2: a(4.6),
    post: a(5.6),
    li: a(1.9),
    refspring: a(10.5),
    rm: a(2.6),
    baand: round(2.6 * k),
    baand2: round(1.2 * k),
    bm: a(4),
    km: a(2.4),
    pm: a(2),
    foto: round(30 * k),
    rende: round(25 * k),
    rendeGab: round(7 * k),
  };
}

/** Trinene i auto-tilpasningen. Aldrig under 0,96 — se `fit.ts`. */
export const FIT_STEPS = [1, 0.98, 0.96] as const;
