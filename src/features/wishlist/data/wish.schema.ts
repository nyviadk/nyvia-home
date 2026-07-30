import { z } from 'zod';

import { oreToInput, parseKronerInput } from '@/lib/money';
import { cleanUrlAndGetTracking } from '@/lib/url/clean-url';
import type { Wish, WishInput } from '../types';

/**
 * Formular-værdier for et ønske. Felterne er strenge (som brugeren taster dem) og konverteres
 * først til det gemte format i `toWishInput` — samme mønster som de øvrige features.
 */
export const wishFormSchema = z.object({
  title: z.string().trim().min(1, 'Skriv en titel'),
  url: z.string(),
  imageUrl: z.string(),
  price: z.string(),
  shipping: z.string(),
  priceInclShipping: z.boolean(),
  description: z.string(),
  favorite: z.boolean(),
  quantity: z.number().int().min(1).max(99),
});

export type WishFormValues = z.infer<typeof wishFormSchema>;

export function toWishFormValues(wish?: Wish): WishFormValues {
  return {
    title: wish?.title ?? '',
    url: wish?.url ?? '',
    imageUrl: wish?.imageUrl ?? '',
    price: typeof wish?.priceOre === 'number' ? oreToInput(wish.priceOre) : '',
    shipping: typeof wish?.shippingOre === 'number' ? oreToInput(wish.shippingOre) : '',
    priceInclShipping: !!wish?.priceInclShipping,
    description: wish?.description ?? '',
    favorite: !!wish?.favorite,
    quantity: wish?.quantity ?? 1,
  };
}

export function toWishInput(values: WishFormValues): WishInput {
  const url = values.url.trim();
  const shippingOre = parseKronerInput(values.shipping);
  return {
    title: values.title.trim(),
    // Rens altid ved gem — også hvis linket blev indsat uden at trykke "Hent".
    url: url ? cleanUrlAndGetTracking(url).cleanUrl : undefined,
    imageUrl: values.imageUrl.trim() || undefined,
    priceOre: parseKronerInput(values.price) ?? undefined,
    currency: 'DKK',
    // Er prisen inkl. fragt, giver et fragtbeløb ikke mening.
    shippingOre: !values.priceInclShipping && shippingOre ? shippingOre : undefined,
    priceInclShipping: values.priceInclShipping,
    description: values.description.trim() || undefined,
    favorite: values.favorite,
    quantity: values.quantity,
  };
}
