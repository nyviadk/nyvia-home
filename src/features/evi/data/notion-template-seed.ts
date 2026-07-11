import type { EviField } from "../types";

/**
 * Engangs-import af Nyvias eksisterende Notion-"ny kunde"-formular som Evi-skabelon.
 *
 * STABILE id'er (slugs) → importen er idempotent: kør den igen for at tilføje nye felter
 * uden dubletter (mergeSeed springer eksisterende id'er over). Notion-trin med ét "Ja"-valg
 * er lavet til `checkbox`; "vælg så mange" → `checklist`; "vælg op til 1" → `choice`.
 * Credentials (password, access tokens, webhook secret) er `sensitive` → krypteres klientside,
 * så de kommer i Evi i stedet for LastPass. Alt kan omdøbes/flyttes/slettes i editoren bagefter.
 */
export const NOTION_SEED_FIELDS: EviField[] = [
  // ── Kunde ──────────────────────────────────────────────────────────────────
  {
    id: "mail",
    label: "Kundens e-mail",
    type: "text",
    section: "Kunde",
    pinned: true,
    reuseKey: "mail",
  },
  {
    id: "opsaetningsdato",
    label: "Opsætningsdato",
    type: "date",
    section: "Kunde",
    pinned: true,
  },
  {
    id: "betaling_deadline",
    label: "Deadline for betaling (prøveperiode)",
    type: "date",
    section: "Kunde",
    pinned: true,
    description: {
      text: "Torsdag → næste torsdag ×3 = sidste betalingsdag (til og med). Betales der ikke, lukkes adgangen dagen efter.",
    },
  },

  // ── Domæner ────────────────────────────────────────────────────────────────
  {
    id: "domaene",
    label: "Kundens fremtidige domæne",
    type: "text",
    section: "Domæner",
    pinned: true,
    reuseKey: "domaene",
  },
  {
    id: "staging_domaene",
    label: "Staging domæne",
    type: "text",
    section: "Domæner",
    pinned: true,
    reuseKey: "staging",
    description: { text: "Det midlertidige bygge-domæne" },
  },
  {
    id: "evimail",
    label: 'Kundens "Evi-mail"',
    type: "text",
    section: "Domæner",
    pinned: true,
    reuseKey: "evimail",
    description: { text: "kundenavn.evi@nyvia.dk" },
    showReuse: ["kundenavn"],
  },

  // ── Opsætning ──────────────────────────────────────────────────────────────
  {
    id: "routing_rule",
    label: "Kunde oprettet i routing rule",
    type: "checkbox",
    section: "Opsætning",
    showReuse: ["evimail"],
    description: {
      text: "Opret route i Cloudflare Email Routing",
      href: "https://dash.cloudflare.com/add38db85ce5aa89e63f8dbb0c1e9dbe/email-service/routing/a5693cc653dfb79ec4b828d037226296/routes/new",
    },
  },
  {
    id: "sprog_tvang",
    label: "Skal hovedsproget tvinges i URL'en?",
    type: "choice",
    section: "Opsætning",
    options: ["Ja (fx /da-dk)", "Nej (kun sprog-fix på ikke-default sider)"],
  },

  // ── Status ─────────────────────────────────────────────────────────────────
  {
    id: "status",
    label: "Status",
    type: "checklist",
    section: "Status",
    pinned: true,
    description: { text: "Oprettet og sendt faktura samt modtaget penge?" },
    options: [
      "Prøveperiode",
      "Oprettet faktura",
      "Sendt faktura",
      "Modtaget penge",
      "Månedens hjemmeside",
      "Andet",
    ],
  },

  // ── Prismic-konto ──────────────────────────────────────────────────────────
  {
    id: "prismic_inkognito",
    label: "Åbnet inkognito og gået til Prismic.io",
    type: "checkbox",
    section: "Prismic-konto",
  },
  {
    id: "prismic_konto",
    label: "Oprettet konto med mailen + genereret password",
    type: "checkbox",
    section: "Prismic-konto",
    showReuse: ["evimail"],
  },
  {
    id: "prismic_password",
    label: "Prismic-konto password",
    type: "sensitive",
    section: "Prismic-konto",
    reuseKey: "prismic_password",
  },
  {
    id: "bekraeft_email",
    label: '"Bekræft e-mail" for kunden',
    type: "checkbox",
    section: "Prismic-konto",
    description: { text: "Åbnet nyvia.dk@gmail.com" },
  },

  // ── Repository ─────────────────────────────────────────────────────────────
  {
    id: "something_else",
    label: 'Valgt "Something else"',
    type: "checkbox",
    section: "Repository",
  },
  {
    id: "repo_name",
    label: "Repository name",
    type: "text",
    section: "Repository",
    pinned: true,
    reuseKey: "repo",
  },
  {
    id: "repo_udfyld",
    label: "Udfyldt repo-felter",
    type: "checklist",
    section: "Repository",
    options: [
      "Repository name",
      "Display name (optional)",
      "Teknologi: Next.js",
      "Create",
    ],
  },

  // ── Prismic tokens ─────────────────────────────────────────────────────────
  {
    id: "prismic_token_step",
    label: "Genereret Access Token (Settings → API & Security)",
    type: "checkbox",
    section: "Prismic tokens",
    description: { text: "Navngiv det → evi_access_token" },
  },
  {
    id: "access_token_scope",
    label: 'Valgt "Master + Releases" i API-token',
    type: "checkbox",
    section: "Prismic tokens",
  },
  {
    id: "access_token_revoke",
    label: 'Revoke "Access to master" initial token',
    type: "checkbox",
    section: "Prismic tokens",
  },
  {
    id: "prismic_access_token",
    label: "Prismic Access Token (evi_access_token)",
    type: "sensitive",
    section: "Prismic tokens",
    reuseKey: "prismic_token",
  },
  {
    id: "write_api_step",
    label: "Oprettet Write API-token (Write APIs → Add a token)",
    type: "checkbox",
    section: "Prismic tokens",
    description: { text: "Navngiv det → prismic_write_api_token" },
  },
  {
    id: "prismic_write_api_token",
    label: "Prismic Write API Token (prismic_write_api_token)",
    type: "sensitive",
    section: "Prismic tokens",
    reuseKey: "prismic_write_api_token",
  },

  // ── Webhook ────────────────────────────────────────────────────────────────
  {
    id: "webhook_step",
    label: "Genereret ny Webhook (Settings → Webhooks)",
    type: "checkbox",
    section: "Webhook",
  },
  {
    id: "webhook_apiurl",
    label: "Skrevet api-url",
    type: "checkbox",
    section: "Webhook",
    command: "https://evi.nyvia.dk/api/revalidate",
    description: { text: "Navngiv: evi_cache_clear" },
  },
  {
    id: "webhook_secret_step",
    label: "Indsat Webhook secret",
    type: "checkbox",
    section: "Webhook",
    command: "xxx",
    description: {
      text: "Den delte webhook-secret.",
    },
  },
  {
    id: "webhook_triggers",
    label: "Sat Triggers (Documents)",
    type: "checkbox",
    section: "Webhook",
    description: {
      text: 'Kun "A document is published" + "A document is unpublished" — IKKE de andre.',
    },
  },

  // ── push-tenant.mjs ────────────────────────────────────────────────────────
  {
    id: "pushtenant_step",
    label: "Kørt scripts/push-tenant.mjs",
    type: "checklist",
    section: "push-tenant",
    command: "node scripts/push-tenant.mjs",
    showReuse: [
      "staging",
      "domaene",
      "repo",
      "prismic_token",
      "prismic_write_api_token",
    ],
    description: {
      text: "Opdatér config-objektet: testDomain, clientDomain, repo, prismic_token, prismic_write_api_token.",
    },
    options: [
      "Tilføj testdomæne (fx nykunde.nyvia.dk)",
      "Tilføjet kundens rigtige domæne",
      "Opdatér config-objektet",
    ],
  },
  {
    id: "pushtenant_discard",
    label: "Ret værdier tilbage (discard changes)",
    type: "checkbox",
    section: "push-tenant",
  },

  // ── Domæne / DNS (Cloudflare) ───────────────────────────────────────────────
  {
    id: "custom_hostnames",
    label: "Gået til Custom Hostnames",
    type: "checkbox",
    section: "DNS",
  },
  {
    id: "hostname_apex",
    label: "Tilføjet kundens domæne (DNS-koder)",
    type: "checklist",
    section: "DNS",
    showReuse: ["domaene"],
    options: [
      "Skriv kundens domæne (fx sarafrisor.dk)",
      "En TXT (verification: _cf-custom-hostname.…)",
      "En CNAME (routing: domæne → CF edge)",
    ],
  },
  {
    id: "hostname_www",
    label: "Tilføjet kundens www-domæne (DNS-koder)",
    type: "checklist",
    section: "DNS",
    showReuse: ["domaene"],
    options: [
      "Skriv www-domæne (fx www.sarafrisor.dk)",
      "En TXT (verification: _cf-custom-hostname.…)",
      "En CNAME (routing: www → CF edge)",
    ],
  },
  {
    id: "live_domaene",
    label: "Tilføjet Live domæne",
    type: "checkbox",
    section: "DNS",
  },
  {
    id: "dns_codes",
    label: "DNS-koder (TXT/CNAME)",
    type: "longtext",
    section: "DNS",
    reuseKey: "dns",
  },

  // ── Indhold (slices/content) ────────────────────────────────────────────────
  {
    id: "default_sprog",
    label: "Sat default sprog i Prismic",
    type: "checkbox",
    section: "Indhold",
  },
  {
    id: "sync_slices",
    label: "Kørt sync-slices script",
    type: "checkbox",
    section: "Indhold",
    showReuse: ["repo"],
    command: "npm run evi:sync-slices -- --target=kunde-repo",
  },
  {
    id: "init_content",
    label: "Kørt init default content",
    type: "checkbox",
    section: "Indhold",
    showReuse: ["staging"],
    command: "node scripts/prismic/write-content.mjs --hostname kunde.nyvia.dk",
  },
  {
    id: "migration_publish",
    label: "Migration release → publish",
    type: "checkbox",
    section: "Indhold",
  },
  {
    id: "slice_simulator",
    label: "Opsat preview /slice-simulator",
    type: "checkbox",
    section: "Indhold",
    showReuse: ["staging"],
    command: "kunde.nyvia.dk/slice-simulator",
    description: { text: "Add your URL (live editing)" },
  },

  // ── Afslutning (mail til kunden) ────────────────────────────────────────────
  {
    id: "velkomstmail",
    label: "Velkomstmail",
    type: "checkbox",
    section: "Afslutning",
    showReuse: ["mail"],
  },
  {
    id: "indsaet_login",
    label: "Indsæt Prismic-login (mail + kode)",
    type: "checkbox",
    section: "Afslutning",
    showReuse: ["evimail", "prismic_password"],
  },
  {
    id: "indsaet_dns_til_kunde",
    label: "Indsæt DNS-koder til kunden",
    type: "checkbox",
    section: "Afslutning",
    showReuse: ["dns"],
    description: {
      text: "Bed kunden sætte dem hos deres domæneudbyder (fx Punktum.dk / Simply).",
    },
  },
  {
    id: "indsaet_staging",
    label: "Indsæt Staging domæne",
    type: "checkbox",
    section: "Afslutning",
    showReuse: ["staging"],
  },
  {
    id: "mail_sendt",
    label: "Mail sendt",
    type: "checkbox",
    section: "Afslutning",
  },
];

/** Stabil serialisering (sorterede nøgler, rekursiv) til at sammenligne felter uafhængigt
 *  af nøgle-rækkefølge, så kun reelt forskellige felter tælles som "ændret". */
function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as Record<string, unknown>)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

/**
 * Synkronisér seed-felterne ind i skabelonen: **opdaterer** felter hvis id'et findes men
 * indholdet er forskelligt (seed vinder), **tilføjer** manglende, og lader bruger-tilføjede
 * felter (ukendte id'er) + rækkefølgen være i fred. Returnerer antal tilføjede/opdaterede.
 * NB: egne rettelser til et seed-felt (fx den rigtige webhook-secret) bliver overskrevet ved
 * re-import — sæt dem, når skabelonen er stabil.
 */
export function mergeSeed(current: EviField[]): {
  fields: EviField[];
  added: number;
  updated: number;
} {
  const seedById = new Map(NOTION_SEED_FIELDS.map((f) => [f.id, f]));
  let updated = 0;
  const out = current.map((f) => {
    const seed = seedById.get(f.id);
    if (seed && stableStringify(seed) !== stableStringify(f)) {
      updated += 1;
      return seed;
    }
    return f;
  });

  const seen = new Set(current.map((f) => f.id));
  let added = 0;
  for (const f of NOTION_SEED_FIELDS) {
    if (seen.has(f.id)) continue;
    out.push(f);
    added += 1;
  }
  return { fields: out, added, updated };
}
