/**
 * Forbrugs-tælling mod Open-Meteos faktiske grænser på gratis-planen.
 * Vi tæller i fire vinduer og bruger dem som den reelle rate-guard — så vi hverken
 * gætter et vilkårligt loft eller kan komme til at sprænge deres grænser.
 */
export const OPEN_METEO_LIMITS = {
  minute: 600,
  hour: 5_000,
  day: 10_000,
  month: 300_000,
} as const;

export type UsageBucket = keyof typeof OPEN_METEO_LIMITS;

export interface UsageCounter {
  /** Hvilket vindue tælleren gælder (skifter nøglen → nulstilles den automatisk). */
  key: string;
  count: number;
}

export type Usage = Record<UsageBucket, UsageCounter>;

export const EMPTY_USAGE: Usage = {
  minute: { key: '', count: 0 },
  hour: { key: '', count: 0 },
  day: { key: '', count: 0 },
  month: { key: '', count: 0 },
};

const BUCKETS = Object.keys(OPEN_METEO_LIMITS) as UsageBucket[];

/** Nøgler for de fire vinduer (UTC — entydigt og uafhængigt af sommertid). */
function usageKeys(now: Date = new Date()): Record<UsageBucket, string> {
  const iso = now.toISOString(); // 2026-07-12T21:03:45.123Z
  return {
    minute: iso.slice(0, 16),
    hour: iso.slice(0, 13),
    day: iso.slice(0, 10),
    month: iso.slice(0, 7),
  };
}

/** Nuværende forbrug pr. vindue (0 hvis vinduet er rullet videre). */
export function currentUsage(usage: Usage): Record<UsageBucket, number> {
  const keys = usageKeys();
  const out = {} as Record<UsageBucket, number>;
  for (const b of BUCKETS) out[b] = usage[b].key === keys[b] ? usage[b].count : 0;
  return out;
}

/** Kan vi bruge `n` kald uden at sprænge NOGEN af grænserne? */
export function canSpend(usage: Usage, n: number): boolean {
  const used = currentUsage(usage);
  return BUCKETS.every((b) => used[b] + n <= OPEN_METEO_LIMITS[b]);
}

/** Registrér `n` kald i alle fire vinduer. */
export function spend(usage: Usage, n: number): Usage {
  const keys = usageKeys();
  const next = {} as Usage;
  for (const b of BUCKETS) {
    next[b] =
      usage[b].key === keys[b]
        ? { key: keys[b], count: usage[b].count + n }
        : { key: keys[b], count: n };
  }
  return next;
}
