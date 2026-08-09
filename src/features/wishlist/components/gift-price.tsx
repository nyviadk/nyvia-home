import { AppText } from '@/components/ui/text';
import { priceLine } from '../price-line';
import type { Wish } from '../types';

/** Prisen på en gave. */
export function GiftPrice({ wish, size = 'large' }: { wish: Wish; size?: 'large' | 'small' }) {
  const line = priceLine(wish);
  if (!line) return null;
  const cls = size === 'large' ? 'text-2xl' : 'text-xl';
  return <AppText className={`${cls} font-semibold text-primary`}>{line}</AppText>;
}
