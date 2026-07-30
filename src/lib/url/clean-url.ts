/**
 * Fjerner tracking-parametre fra en URL, så gemte links er rene (og ikke bærer affiliate-/
 * kampagne-sporing videre til dem, man deler med).
 *
 * Listen er kurateret på tværs af projekter — udvid den frem for at lave lokale varianter.
 */
const TRACKING_PARAMS: Set<string> = new Set([
  // --- Standard UTM (Google Analytics & generel marketing) ---
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  '_ga',
  '_gl',
  '_up',

  // --- Google & YouTube Ads (inkl. ValueTrack) ---
  'gclid',
  'gbraid',
  'wbraid',
  'dclid',
  'gad_source',
  'gad_campaignid',
  'campaignid',
  'adgroupid',
  'matchtype',
  'network',
  'device',
  'devicemodel',
  'creative',
  'keyword',
  'placement',
  'srsltid',
  'newparameter',

  // --- Meta (Facebook & Instagram) & generisk ad-tracking ---
  'fbclid',
  'igshid',
  'h_ad_id',
  'campaign_id',
  'adset_id',
  'ad_id',
  'adid',

  // --- Andre sociale medier ---
  'ttclid',
  'epik',
  'twclid',
  'li_fat_id',
  'msclkid',

  // --- Email & CRM ---
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'mkt_tok',
  'hnt',

  // --- Affiliate & referral ---
  'cid',
  'ref',
  'ref_src',
  'ref_url',
  'tag',
  'ascsubtag',
  'linkcode',

  // --- Amazon-specifik støj ---
  'pd_rd_r',
  'pd_rd_w',
  'pd_rd_wg',
  'pd_rd_i',
  'pf_rd_p',
  'pf_rd_r',
  'pf_rd_s',
  'pf_rd_t',
  'pf_rd_i',
  'pf_rd_m',
  'crid',
  'sprefix',
  'qid',
  'sr',
  'dib',
  'dib_tag',
  'aref',
  'sp_csd',
  'pd_rd_plhdr',
  'content-id',
  'keywords',
  'rnid',
  'node',

  // --- Diverse støj & tekniske parametre ---
  'ie',
  'ts_id',
  'yclid',
  '_branch_match_id',
  's_kwcid',
  'wickedid',

  // --- Google Ads interne parametre ---
  'igaag',
  'igaat',
  'igacm',
  'igacr',
  'igakw',
  'igamt',
  'igant',

  // --- Enterprise & e-handel ---
  's_cid',
  'sc_cid',
  'cmpid',
  'emid',
  'elqtrackid',
  'elq',
  'pk_campaign',
  'pk_kwd',
  'mtm_campaign',
  'mtm_source',
  'piwik_campaign',
  'ranmid',
  'raneaid',
  'ransiteid',
  'irclickid',
  'sharedid',
  'awc',
  'mkevt',
  'mkcid',
  'mkrid',
  'campid',
  'toolid',
  'customid',
  'ga_order',
  'ga_search_query',
  'ga_search_type',
  '_ke',
  'shpxid',
  '_kx',
  'pi_id',
  'picid',
  'goal',
  'vgo_ee',
  '_bta_tid',
  '_bta_c',
  'rdt_cid',
  'scid',
  'q_id',
  'ep_click_id',
  'usqp',
  'ved',
  'ei',
  'gs_lcp',
  'sclient',
]);

/** Præfikser der altid er tracking (fanger custom-varianter som `utm_adgroup`, `_gac_…`). */
const TRACKING_PREFIXES = [
  'utm_',
  '_ga',
  'gad_',
  'hsa_',
  '_hs',
  'mtm_',
  'pk_',
  'rb_',
  'ir',
  's_kwcid',
];

const isTracking = (key: string): boolean =>
  TRACKING_PARAMS.has(key) || TRACKING_PREFIXES.some((p) => key.startsWith(p));

/**
 * Returnerer URL'en uden tracking + en streng med det, der blev fjernet (til visning/debug).
 * Ugyldige URL'er returneres uændret — vi gætter aldrig på brugerens input.
 */
export function cleanUrlAndGetTracking(rawUrl: string): {
  cleanUrl: string;
  removedParams: string;
} {
  try {
    const urlObj = new URL(rawUrl);
    const params = new URLSearchParams(urlObj.search);
    const removed: string[] = [];
    let hasChanges = false;

    // Amazons indlejrede sti-tracking (fx /dp/ASIN/ref=sr_1_2_sspa).
    if (urlObj.hostname.includes('amazon.') && urlObj.pathname.includes('/ref=')) {
      const [base, refPart] = urlObj.pathname.split('/ref=');
      removed.push(`[path_ref]=ref=${refPart}`);
      urlObj.pathname = base;
      hasChanges = true;
    }

    const keysToDelete: string[] = [];
    params.forEach((value, key) => {
      if (isTracking(key.toLowerCase())) {
        keysToDelete.push(key);
        removed.push(`${key}=${value}`);
      }
    });
    for (const key of keysToDelete) {
      params.delete(key);
      hasChanges = true;
    }

    if (!hasChanges) return { cleanUrl: rawUrl, removedParams: '' };

    urlObj.search = params.toString();
    return {
      cleanUrl: urlObj.toString().replace(/\?$/, ''),
      removedParams: `?${removed.join('&')}`,
    };
  } catch {
    return { cleanUrl: rawUrl, removedParams: '' };
  }
}

/** Kortform når man kun skal bruge den rene URL. */
export const cleanUrl = (rawUrl: string): string => cleanUrlAndGetTracking(rawUrl).cleanUrl;
