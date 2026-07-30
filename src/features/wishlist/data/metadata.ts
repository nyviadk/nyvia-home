import { SITE_URL } from '@/constants/site';

export type WishMetadata = {
  title?: string;
  imageUrl?: string;
  /** Pris i hele kroner (ikke øre) — formen konverterer. */
  price?: number;
  currency?: string;
};

/**
 * Henter strukturerede metadata for en produkt-URL via app'ens egen API-rute (`/metadata+api.ts`).
 *
 * Web bruger en RELATIV sti — så det virker både på localhost i udvikling og i produktion (og
 * undgår CORS). Native har ingen origin og peger derfor på det deployede domæne.
 */
/** Klient-timeout — kun lidt over serverens egne 8s, så dens præcise fejl normalt når frem først. */
const CLIENT_TIMEOUT_MS = 11000;

export async function fetchWishMetadata(url: string): Promise<WishMetadata> {
  const base = process.env.EXPO_OS === 'web' ? '' : SITE_URL;
  // Uden en abort ville et svar der aldrig kommer (fx dev-server der genstarter, eller mistet
  // netværk) lade knappen spinne i det uendelige.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${base}/metadata?url=${encodeURIComponent(url.trim())}`, {
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Serveren svarede ikke. Er siden deployet? Udfyld felterne selv så længe.');
    }
    throw new Error('Ingen forbindelse til serveren');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'Kunne ikke hente data fra linket');
  }
  return (await res.json()) as WishMetadata;
}
