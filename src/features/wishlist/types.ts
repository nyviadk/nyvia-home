/**
 * En reservation ligger PÅ selve ønsket (skjules i UI når ejeren er logget ind — ikke en separat
 * sti). `by` er en LISTE, så flere kan gå sammen om samme gave; tom/udeladt = anonym reservation.
 * `qty` = hvor mange stk. denne reservation dækker.
 */
/**
 * En reservation = nogen TAGER gaven (og betaler den). Penge hører ikke til her — de ligger som
 * `GiftContribution`, så et bidrag på 200 kr. til en gave til 1.299 ikke markerer den som taget.
 */
export type WishReservation = {
  /** Tom/udeladt = anonym. */
  by?: string[];
  /** Antal stk. denne reservation dækker. */
  qty: number;
};

/**
 * Et tilskud til ÉN bestemt gave, fx "Mor giver 200 kr.".
 *
 * Der var tidligere også en fælles pulje, hvor penge kunne ligge frit og flyttes mellem gaver.
 * Den blev fjernet: den krævede opdeling/sammenlægning, sporing af oprindelse og parkering når
 * en gave blev fuldt reserveret — alt for meget maskineri til en familie-ønskeliste.
 */
export type GiftContribution = {
  by?: string[];
  amountOre: number;
  wishId: string;
  createdAt: string;
};

/** En kommentar. `wishId` null = generel tråd, sat = kommentar til den gave. */
export type WishComment = {
  by?: string[];
  text: string;
  wishId?: string | null;
  createdAt: string;
};

/** Navnene på en reservation. Tåler gamle poster hvor `by` var én streng. */
export function reservationNames(r: WishReservation): string[] {
  const by = r.by as unknown;
  if (typeof by === 'string') return by.trim() ? [by.trim()] : [];
  return Array.isArray(by) ? by.filter((n) => typeof n === 'string' && n.trim()) : [];
}

/** Visningsnavn: "Mor & Far", eller "Anonym" hvis ingen navne. */
export function reservationLabel(r: WishReservation): string {
  const names = reservationNames(r);
  return names.length ? names.join(' & ') : 'Anonym';
}

/** Læsbar liste af navne, eller "Anonym". */
export function namesLabel(by?: string[]): string {
  const names = (by ?? []).filter((n) => typeof n === 'string' && n.trim());
  return names.length ? names.join(' & ') : 'Anonym';
}

/** Samlet beløb (øre) i en samling bidrag. */
export function sumContributions(items: { amountOre: number }[]): number {
  return items.reduce((sum, c) => sum + (c.amountOre || 0), 0);
}

/** Et ønske. Penge i øre. `quantity` = ønsket antal (kan ønskes flere af). */
export type Wish = {
  title: string;
  url?: string;
  imageUrl?: string;
  /** null = ingen pris angivet (tomme felter skrives eksplicit, så de kan ryddes ved redigering). */
  priceOre?: number | null;
  currency?: string;
  /** Fragt i øre (hvis prisen IKKE er inkl. fragt). */
  shippingOre?: number | null;
  /** Prisen er inkl. fragt. */
  priceInclShipping?: boolean;
  description?: string;
  favorite: boolean;
  quantity: number;
  reservations: WishReservation[];
  createdAt: string;
  updatedAt: string;
};

export type WishInput = Pick<
  Wish,
  | 'title'
  | 'url'
  | 'imageUrl'
  | 'priceOre'
  | 'currency'
  | 'shippingOre'
  | 'priceInclShipping'
  | 'description'
  | 'favorite'
  | 'quantity'
>;

/**
 * Noget en gæst har købt, som IKKE står på ønskelisten — så to ikke køber det samme.
 * Skjules for ejeren på samme måde som reservationer.
 */
export type WishlistExtra = {
  text: string;
  by?: string[];
  createdAt: string;
};

/** Antal stk. en reservation dækker. En reservation betyder ALTID "tager gaven", så mindst 1 —
 *  det retter også gamle rækker fra dengang beløb lå på reservationen (de blev gemt med qty 0). */
export function reservationQty(r: WishReservation): number {
  return Math.max(1, Math.floor(r.qty || 1));
}

/** Antal stk. der er TAGET. Pengebidrag ligger i `GiftContribution` og tæller ikke med her. */
export function reservedCount(wish: Pick<Wish, 'reservations'>): number {
  return (wish.reservations ?? []).reduce((n, r) => n + reservationQty(r), 0);
}
export function remainingCount(wish: Pick<Wish, 'reservations' | 'quantity'>): number {
  return Math.max(0, (wish.quantity || 1) - reservedCount(wish));
}

/** Ejerens indstillinger for den offentlige side (navn + titel på listen). */
export type WishlistSettings = {
  /** Overskriften på den delte side, fx "Nyvias ønskeliste". Var før delt i navn + titel, men
   *  de endte som det samme. */
  title?: string;
};

/**
 * Fast sortering: favoritter øverst, derefter pris lav→høj (ønsker uden pris til sidst).
 * Erstatter manuel omarrangering — færre knapper, og listen ser altid ens ud for alle.
 */
export function sortWishes<T extends Pick<Wish, 'favorite' | 'priceOre' | 'title'>>(wishes: T[]): T[] {
  const price = (w: T) => (typeof w.priceOre === 'number' ? w.priceOre : Number.POSITIVE_INFINITY);
  return [...wishes].sort(
    (a, b) =>
      (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) ||
      price(a) - price(b) ||
      a.title.localeCompare(b.title, 'da'),
  );
}

