import { genId } from '@/lib/id';
import type { UvPlace } from '../types';

const BASE = 'https://geocoding-api.open-meteo.com/v1/search';

interface GeoResult {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  admin1?: string;
}

/**
 * Søg efter steder via Open-Meteos geocoding (gratis, ingen nøgle) — så du skriver "Tranbjerg"
 * i stedet for at taste koordinater. VPN-immun: det er ren tekst-opslag, ikke IP-baseret.
 */
export async function searchPlaces(query: string): Promise<UvPlace[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const res = await fetch(`${BASE}?name=${encodeURIComponent(q)}&count=8&language=da&format=json`);
  if (!res.ok) throw new Error(`Steds-søgning fejlede (${res.status})`);

  const data = (await res.json()) as { results?: GeoResult[] };
  return (data.results ?? [])
    .filter((r) => r.name && Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => ({
      id: String(r.id ?? genId()),
      name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
      lat: Number(r.latitude),
      lon: Number(r.longitude),
    }));
}
