import { formatDKKWhole } from '@/lib/money';
import type { Wish } from './types';

/**
 * Pris-linjen for et ønske: "1.299 kr." / "1.299 kr. + 49 kr. fragt" / "1.299 kr. inkl. fragt".
 * Tom streng hvis der ikke er nogen pris. Lå før i tre identiske kopier (ejer-kort,
 * gæste-kort og gave-siden), som skulle holdes i sync i hånden.
 */
export function priceLine(w: Wish): string {
  if (typeof w.priceOre !== 'number') return '';
  const base = formatDKKWhole(w.priceOre);
  if (w.priceInclShipping) return `${base} inkl. fragt`;
  if (typeof w.shippingOre === 'number' && w.shippingOre > 0)
    return `${base} + ${formatDKKWhole(w.shippingOre)} fragt`;
  return base;
}
