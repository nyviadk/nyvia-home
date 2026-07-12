import { nowISO } from '@/lib/datetime';
import type { UvPlace, UvSnapshot } from '../types';

const BASE = 'https://api.open-meteo.com/v1/forecast';

/** Hvor mange dage frem vi henter (Open-Meteo tillader 0-16). */
export const FORECAST_DAYS = 4;

interface OpenMeteoResponse {
  current?: { time?: number; interval?: number; uv_index_clear_sky?: number };
  minutely_15?: { time?: number[]; uv_index_clear_sky?: number[] };
  daily?: { time?: number[]; uv_index_clear_sky_max?: number[] };
}

/**
 * Henter KUN UV fra Open-Meteo (gratis plan — ingen API-nøgle).
 *
 * - `uv_index_clear_sky` = UV UDEN skyer: det direkte, højeste potentiale (worst case).
 *   Bevidst valgt frem for `uv_index` (som dæmpes af skydække).
 * - `minutely_15` frem for `hourly`: ægte 15-minutters opløsning (verificeret: dækker hele
 *   4-dages-perioden). Så et skift kl. ~09:30 hviler på målte punkter i stedet for en
 *   interpolation hen over en hel time.
 * - `timeformat=unixtime` → entydige tidspunkter, ingen tidszone-tvetydighed.
 *
 * Data: Open-Meteo (CC BY 4.0).
 */
export async function fetchUvForecast(place: UvPlace): Promise<UvSnapshot> {
  const url =
    `${BASE}?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=uv_index_clear_sky&minutely_15=uv_index_clear_sky&daily=uv_index_clear_sky_max` +
    `&timezone=auto&forecast_days=${FORECAST_DAYS}&timeformat=unixtime`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo svarede ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;

  const times = data.minutely_15?.time ?? [];
  const values = data.minutely_15?.uv_index_clear_sky ?? [];
  const dayTimes = data.daily?.time ?? [];
  const dayMax = data.daily?.uv_index_clear_sky_max ?? [];

  return {
    placeId: place.id,
    current: Number(data.current?.uv_index_clear_sky ?? 0),
    currentT: Number(data.current?.time ?? Math.floor(Date.now() / 1000)),
    intervalSec: Number(data.current?.interval ?? 900),
    series: times.map((t, i) => ({ t, uv: Number(values[i] ?? 0) })),
    daily: dayTimes.map((t, i) => ({ t, max: Number(dayMax[i] ?? 0) })),
    fetchedAt: nowISO(),
    lat: place.lat,
    lon: place.lon,
  };
}
