/** Et gemt sted. Koordinater kommer fra Open-Meteos geocoding (du taster aldrig tal). */
export interface UvPlace {
  id: string;
  /** Fx "Tranbjerg, Region Midtjylland, Danmark". */
  name: string;
  lat: number;
  lon: number;
}

/** Ét punkt i prognosen. `t` er unix-sekunder → entydigt, uafhængigt af tidszone. */
export interface UvPoint {
  t: number;
  uv: number;
}

export interface UvDay {
  t: number;
  max: number;
}

/**
 * Et hentet UV-svar. Vi henter KUN `uv_index_clear_sky` — UV UDEN skyer, altså det direkte,
 * højeste potentiale (worst case). Bevidst valgt frem for det sky-dæmpede `uv_index`.
 */
export interface UvSnapshot {
  /** Hvilket sted dette snapshot gælder for. */
  placeId: string;
  /** Aktuelt clear-sky UV-indeks lige nu. */
  current: number;
  /** Unix-tid for DET 15-min-slot data'en stammer fra (Open-Meteos eget slot). */
  currentT: number;
  /** Slot-længde i sekunder (Open-Meteo: 900). Næste data findes ved currentT + intervalSec. */
  intervalSec: number;
  /**
   * 15-MINUTTERS serie (Open-Meteo `minutely_15`), hele prognose-perioden.
   * Giver ægte målte punkter omkring et skift — frem for at interpolere hen over en hel time.
   */
  series: UvPoint[];
  /** Maks clear-sky UV pr. dag. */
  daily: UvDay[];
  fetchedAt: string;
  lat: number;
  lon: number;
}
