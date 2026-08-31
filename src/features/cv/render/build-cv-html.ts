import { escapeHtml as e } from '@/lib/html/escape-html';
import type { CvStil } from '../types';
import { buildSide1 } from './build-side1';
import { buildSide2 } from './build-side2';
import { computeCvVars } from './cv-metrics';
import { cvCss } from './cv-print.css';
import type { RenderDoc } from './render-doc';

/**
 * Hele dokumentet: de to sider, CSS'en og målestokken.
 *
 * Ren funktion uden DOM. Det er dét, der gør at man kan gemme resultatet i en fil og åbne
 * det i browseren — layoutet kan fejlsøges helt uden iframe-maskineriet, og "Kopiér HTML"
 * bliver stående som permanent nødudgang hvis print-rammen driller.
 *
 * `k` er auto-tilpasningens skala. Den ganges ind i `computeCvVars`, så CSS'en er den
 * eneste der ændrer sig mellem forsøgene — HTML'en er den samme.
 */
export function buildCvHtml(
  doc: RenderDoc,
  stil: CvStil,
  k: number,
  /**
   * Hvor `/fonts/...` skal hentes fra. Skrives dokumentet ind i en `about:blank`-iframe,
   * er dens base-URL ikke til at regne med — og uden skrifterne måler vi i fallback-skriften
   * og får et `k` der ser rigtigt ud men er forkert. Kaldes funktionen uden, udelades
   * `<base>` (fx når HTML'en gemmes i en fil ved siden af `public/`).
   */
  baseHref?: string
): string {
  const vars = computeCvVars(stil, doc.brandfarve, k);
  const titel = [doc.navn, doc.titel].filter(Boolean).join(' — ');

  return `<!doctype html>
<html lang="${doc.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${baseHref ? `<base href="${e(baseHref)}">` : ''}
<title>${e(titel || 'CV')}</title>
<style>${cvCss(vars)}</style>
</head>
<body>
<div id="mm-probe"></div>
${buildSide1(doc)}
${buildSide2(doc)}
</body>
</html>`;
}
