import { AppText } from '@/components/ui/text';
import { formatDKKWhole } from '@/lib/money';
import type { Wish } from '../types';

/** "1.299 kr." / "1.299 kr. + 49 kr. fragt" / "1.299 kr. inkl. fragt". */
export function priceLine(w: Wish): string {
  if (typeof w.priceOre !== 'number') return '';
  const base = formatDKKWhole(w.priceOre);
  if (w.priceInclShipping) return `${base} inkl. fragt`;
  if (typeof w.shippingOre === 'number' && w.shippingOre > 0)
    return `${base} + ${formatDKKWhole(w.shippingOre)} fragt`;
  return base;
}

/** Prisen på en gave. */
export function GiftPrice({ wish, size = 'large' }: { wish: Wish; size?: 'large' | 'small' }) {
  const line = priceLine(wish);
  if (!line) return null;
  const cls = size === 'large' ? 'text-2xl' : 'text-xl';
  return <AppText className={`${cls} font-semibold text-primary`}>{line}</AppText>;
}
