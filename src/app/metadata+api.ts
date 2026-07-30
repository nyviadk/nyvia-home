/**
 * Server-endpoint der læser STRUKTUREREDE metadata (schema.org JSON-LD + Open Graph) fra en
 * produkt-URL: `GET /metadata?url=…` → `{ title?, imageUrl?, price?, currency? }`.
 *
 * Kører server-side, fordi browseren ikke må hente fremmede domæner (CORS). Best-effort: felter
 * der ikke findes, udelades — brugeren udfylder dem selv. Ingen scraping af visuelt layout, kun
 * de data siden selv publicerer til maskiner.
 */

type Meta = { title?: string; imageUrl?: string; price?: number; currency?: string };

const MAX_BYTES = 1_500_000; // stop før vi æder hukommelse på store sider
const TIMEOUT_MS = 8000;

/** Første ikke-tomme streng i et vilkårligt JSON-LD-felt (kan være streng, objekt eller array). */
function firstString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const v of value) {
      const s = firstString(v);
      if (s) return s;
    }
    return undefined;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return firstString(o.url ?? o['@id'] ?? o.contentUrl ?? o.name);
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    // "1.299,00" (da) / "1,299.00" (en) / "1299.00" → normalisér til punktum-decimal.
    const cleaned = value.replace(/[^\d.,-]/g, '');
    const normalised =
      cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    const n = Number.parseFloat(normalised);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Flad alle JSON-LD-noder ud. Følger de containere butikker rent faktisk bruger: `@graph`,
 * `hasVariant` (ProductGroup → varianter, fx Matas), `itemListElement` og `mainEntity`.
 */
const CONTAINER_KEYS = ['@graph', 'hasVariant', 'itemListElement', 'mainEntity'] as const;

function flattenNodes(node: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    for (const n of node) flattenNodes(n, out);
  } else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    out.push(o);
    for (const key of CONTAINER_KEYS) if (o[key]) flattenNodes(o[key], out);
  }
  return out;
}

/** Er noden en produkt-node? Dækker Product, ProductGroup, IndividualProduct m.fl. */
const isProduct = (node: Record<string, unknown>): boolean => {
  const t = node['@type'];
  const match = (x: unknown) => typeof x === 'string' && x.toLowerCase().includes('product');
  return Array.isArray(t) ? t.some(match) : match(t);
};

/** Pris ud af en Offer — kan ligge direkte eller inde i priceSpecification. */
function offerPrice(offer: Record<string, unknown>): number | undefined {
  const direct = toNumber(offer.price ?? offer.lowPrice);
  if (direct != null) return direct;
  for (const spec of flattenNodes(offer.priceSpecification)) {
    const n = toNumber(spec.price);
    if (n != null) return n;
  }
  return undefined;
}

function fromJsonLd(html: string): Meta {
  const meta: Meta = {};
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1].trim());
    } catch {
      continue; // ugyldig JSON-LD på siden — spring over
    }
    for (const node of flattenNodes(parsed)) {
      if (!isProduct(node)) continue;
      meta.title ??= firstString(node.name);
      meta.imageUrl ??= firstString(node.image);
      // offers kan være objekt, array eller AggregateOffer
      for (const offer of flattenNodes(node.offers)) {
        meta.price ??= offerPrice(offer);
        meta.currency ??= firstString(offer.priceCurrency);
      }
      if (meta.title && meta.price != null) return meta;
    }
  }
  return meta;
}

/** <meta property="og:title" content="…"> — attributterne kan stå i vilkårlig rækkefølge. */
function metaTag(html: string, names: string[]): string | undefined {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`,
        'i',
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]?.trim()) return m[1].trim();
    }
  }
  return undefined;
}

/**
 * Nogle butikker svarer med en bot-beskyttelses-side (Cloudflare, DataDome, Imperva) i stedet for
 * produktet. Den har status 200 og en titel som "Making sure you're not a bot!", så uden dette
 * tjek ville vi gemme challenge-sidens titel som ønskets navn. Vi kan ikke — og skal ikke — omgå
 * beskyttelsen; vi melder ærligt tilbage, så brugeren udfylder felterne selv.
 */
const CHALLENGE_MARKERS = [
  'making sure you', // "Making sure you're not a bot!" (Anubis) — apostroffen varierer
  'not a bot',
  'just a moment',
  'checking your browser',
  'enable javascript and cookies to continue',
  'cf-browser-verification',
  'attention required!',
  'pardon our interruption',
  'access denied',
  'are you a human',
  'verifying you are human',
  'datadome',
  'px-captcha',
  'recaptcha',
  'within.website', // Anubis' assets
];

function looksLikeChallenge(html: string, title?: string): boolean {
  // Afkod FØRST: challenge-sider skriver ofte "you&#39;re" frem for "you're", og uden afkodning
  // ville teksten aldrig matche markørerne.
  const haystack = decodeEntities(`${title ?? ''}\n${html.slice(0, 4000)}`).toLowerCase();
  return CHALLENGE_MARKERS.some((m) => haystack.includes(m));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export async function GET(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get('url')?.trim();
  if (!target) return Response.json({ error: 'Mangler ?url=' }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return Response.json({ error: 'Ugyldig URL' }, { status: 400 });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return Response.json({ error: 'Kun http/https' }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let html: string;
  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Mange butikker svarer med tom/blokeret HTML uden en almindelig browser-UA. De øvrige
        // headers efterligner et normalt navigations-request — nok til de simple tjek, men
        // rigtige bot-beskyttelser (Cloudflare/DataDome) kræver JS og fanges nedenfor i stedet.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'da-DK,da;q=0.9,en;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
    });
    const raw = await res.text();
    if (!res.ok) {
      // 403 + en challenge-side = bot-beskyttelse (fx Cloudflare), ikke en død side.
      const blocked = res.status === 403 || res.status === 429 || looksLikeChallenge(raw);
      return Response.json(
        {
          error: blocked
            ? 'Butikken blokerer automatisk hentning — udfyld felterne selv'
            : `Siden svarede ${res.status}`,
        },
        { status: 502 },
      );
    }
    html = raw.length > MAX_BYTES ? raw.slice(0, MAX_BYTES) : raw;
  } catch {
    return Response.json({ error: 'Kunne ikke hente siden' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }

  const ld = fromJsonLd(html);
  const title =
    ld.title ??
    metaTag(html, ['og:title', 'twitter:title']) ??
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();

  // Fandt vi ingen strukturerede produktdata OG siden ligner en bot-kontrol, så er det ikke
  // produktet vi har fat i — meld fejl frem for at gemme challenge-sidens titel som ønske.
  if (ld.price == null && !ld.title && looksLikeChallenge(html, title)) {
    return Response.json(
      { error: 'Butikken blokerer automatisk hentning — udfyld felterne selv' },
      { status: 502 },
    );
  }
  const imageRaw = ld.imageUrl ?? metaTag(html, ['og:image', 'og:image:url', 'twitter:image']);
  const price =
    ld.price ??
    toNumber(metaTag(html, ['product:price:amount', 'og:price:amount', 'twitter:data1']));
  const currency =
    ld.currency ?? metaTag(html, ['product:price:currency', 'og:price:currency']) ?? 'DKK';

  // Relative billed-URL'er gøres absolutte, så <Image> kan vise dem.
  let imageUrl: string | undefined;
  if (imageRaw) {
    try {
      imageUrl = new URL(decodeEntities(imageRaw), parsed).toString();
    } catch {
      imageUrl = undefined;
    }
  }

  return Response.json({
    ...(title ? { title: decodeEntities(title).slice(0, 200) } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(price != null ? { price } : {}),
    ...(price != null ? { currency } : {}),
  } satisfies Meta);
}
