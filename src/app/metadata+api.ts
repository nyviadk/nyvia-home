import { extractMeta, looksLikeChallenge } from '@/features/wishlist/data/metadata-parse';

/**
 * `GET /metadata?url=…` → `{ title?, imageUrl?, price?, currency? }`.
 *
 * Kører server-side, fordi browseren ikke må hente fremmede domæner (CORS). Selve
 * udtrækket ligger i `features/wishlist/data/metadata-parse` — her er kun HTTP-laget.
 */

const MAX_BYTES = 1_500_000; // stop før vi æder hukommelse på store sider
const TIMEOUT_MS = 8000;

const BROWSER_HEADERS = {
  // Mange butikker svarer med tom/blokeret HTML uden en almindelig browser-UA. De øvrige
  // headers efterligner et normalt navigations-request — nok til de simple tjek, men
  // rigtige bot-beskyttelser (Cloudflare/DataDome) kræver JS og fanges nedenfor i stedet.
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'da-DK,da;q=0.9,en;q=0.8',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

const BLOCKED = 'Butikken blokerer automatisk hentning — udfyld felterne selv';
const fail = (error: string, status: number) => Response.json({ error }, { status });

/** Validér ?url= — kun absolutte http(s)-adresser. */
function parseTarget(request: Request): URL | null {
  const raw = new URL(request.url).searchParams.get('url')?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null;
  } catch {
    return null;
  }
}

/** Hent siden med timeout og størrelsesloft. Returnerer HTML eller en fejl-tekst. */
async function fetchHtml(target: URL): Promise<{ html: string } | { error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: BROWSER_HEADERS,
    });
    const raw = await res.text();
    if (!res.ok) {
      // 403/429 + en challenge-side = bot-beskyttelse (fx Cloudflare), ikke en død side.
      const blocked = res.status === 403 || res.status === 429 || looksLikeChallenge(raw);
      return { error: blocked ? BLOCKED : `Siden svarede ${res.status}` };
    }
    return { html: raw.length > MAX_BYTES ? raw.slice(0, MAX_BYTES) : raw };
  } catch {
    return { error: 'Kunne ikke hente siden' };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request): Promise<Response> {
  const target = parseTarget(request);
  if (!target) return fail('Mangler eller ugyldig ?url= (kun http/https)', 400);

  const fetched = await fetchHtml(target);
  if ('error' in fetched) return fail(fetched.error, 502);

  const meta = extractMeta(fetched.html, target);
  return meta ? Response.json(meta) : fail(BLOCKED, 502);
}
