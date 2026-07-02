import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import {
  formatDateCopenhagen,
  formatDateTimeCopenhagen,
  todayISODate,
} from "@/lib/datetime";
import { imageToDataUri } from "@/lib/capture/image-data-uri";
import type { WithId } from "@/lib/firebase";
import { toastAfter } from "@/lib/toast/notify";
import type { InspectionItem } from "../types";

function esc(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}

function buildHtml(
  address: string,
  items: WithId<InspectionItem>[],
  srcOf: (url: string) => string,
  extraInfo?: string,
): string {
  // Sortér: rum (alfabetisk, "uden rum" sidst via Ω), derefter oprettelses-tid.
  const sorted = [...items].sort(
    (a, b) =>
      (a.room?.trim() || "Ω").localeCompare(b.room?.trim() || "Ω", "da") ||
      a.createdAt.localeCompare(b.createdAt),
  );

  const parts: string[] = [];
  let currentRoom: string | null = null;
  let n = 0;
  for (const it of sorted) {
    const room = it.room?.trim() || "Uden rum";
    if (room !== currentRoom) {
      parts.push(`<h2 class="room">${esc(room)}</h2>`);
      currentRoom = room;
    }
    n += 1;
    const imgs = it.photos
      .map((p) => {
        const cap = p.takenAt
          ? `<div class="cap">Taget ${esc(formatDateTimeCopenhagen(p.takenAt))}</div>`
          : "";
        return `<figure><img src="${srcOf(p.url)}" />${cap}</figure>`;
      })
      .join("");
    const notes = it.notes ? `<p class="notes">${esc(it.notes)}</p>` : "";
    parts.push(`<div class="item">
      <div class="head"><span class="num">${n}</span><span class="title">${esc(it.title)}</span></div>
      ${notes}
      ${imgs ? `<div class="imgs">${imgs}</div>` : ""}
    </div>`);
  }

  return `<!DOCTYPE html><html lang="da"><head><meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(address)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; color: #2a2a28; margin: 0; padding: 32px; }
      header { border-bottom: 3px solid #2f7d6b; padding-bottom: 12px; margin-bottom: 18px; }
      h1 { font-size: 22px; margin: 0; }
      .addr { font-size: 16px; font-weight: 600; margin: 4px 0 0; }
      .meta { color: #7a756c; font-size: 12px; margin: 3px 0 0; }
      .extra { margin: 8px 0 0; font-size: 13px; color: #2a2a28; white-space: pre-line; }
      h2.room { font-size: 14px; color: #2f7d6b; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e8e3da; text-transform: uppercase; letter-spacing: 0.04em; break-after: avoid; page-break-after: avoid; break-inside: avoid; }
      .item { border: 1px solid #e8e3da; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; page-break-inside: avoid; }
      .head { display: flex; align-items: center; gap: 8px; }
      .num { background: #2f7d6b; color: #fff; min-width: 22px; height: 22px; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
      .title { font-weight: 600; font-size: 15px; }
      .notes { margin: 8px 0 0; font-size: 13px; color: #4a463f; }
      .imgs { margin-top: 10px; }
      figure { display: block; width: fit-content; max-width: 100%; margin: 0 auto 12px; break-inside: avoid; page-break-inside: avoid; }
      figure img { display: block; max-width: 100%; max-height: 420px; border-radius: 8px; border: 1px solid #e8e3da; }
      .cap { font-size: 10px; color: #7a756c; margin-top: 2px; text-align: right; }
      @page { margin: 22px; }
    </style></head><body>
    <header>
      <h1>Fejl- og mangelliste</h1>
      <p class="addr">${esc(address)}</p>
      <p class="meta">Udarbejdet ${esc(formatDateCopenhagen(todayISODate()))} · ${items.length} mangel(er)</p>
      ${extraInfo?.trim() ? `<div class="extra">${esc(extraInfo.trim())}</div>` : ""}
    </header>
    ${parts.join("") || '<p class="meta">Ingen poster.</p>'}
  </body></html>`;
}

/**
 * Web: print MIN html i en skjult iframe (ikke browserens print af app-siden). Base64-
 * billederne er inline, så de er klar med det samme. Print-dialogen kan gemme som PDF.
 */
function printHtmlOnWeb(html: string): void {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);
  const cw = iframe.contentWindow;
  const doc = cw?.document;
  if (!cw || !doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cw.focus();
    cw.print();
    setTimeout(() => iframe.remove(), 1500);
  };
  // load-event venter på at ALLE resurser (også billeder) er hentet → print derefter.
  // Lang fallback som sidste udvej hvis load aldrig fyrer.
  cw.addEventListener("load", () => setTimeout(run, 250));
  setTimeout(run, 4000);
}

/**
 * Bygger en pæn, brandingfri PDF af indflytningssynet (til udlejer) og deler den.
 * Web: åbner print-/gem-som-PDF-dialog med selve rapporten (ikke app-siden).
 */
export async function exportInspectionPdf(
  address: string,
  items: WithId<InspectionItem>[],
  extraInfo?: string,
): Promise<void> {
  await toastAfter(
    (async () => {
      // Indlejr alle fotos som base64 (så de altid kommer med i PDF'en).
      const uriByUrl = new Map<string, string>();
      for (const it of items) {
        for (const p of it.photos) {
          if (uriByUrl.has(p.url)) continue;
          // imageToDataUri er platform-splittet (native: expo-file-system, web: fetch+FileReader)
          // og falder selv tilbage til URL'en ved fejl.
          uriByUrl.set(p.url, await imageToDataUri(p.url));
        }
      }
      const html = buildHtml(
        address,
        items,
        (url) => uriByUrl.get(url) ?? url,
        extraInfo,
      );

      if (process.env.EXPO_OS === "web") {
        printHtmlOnWeb(html);
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
        });
      }
    })(),
    "PDF klar",
  );
}
