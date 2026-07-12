import type { UvPlace } from '../types';

const isWeb = process.env.EXPO_OS === 'web';

/** Browserens lokationstjeneste findes kun på web (native har ingen uden expo-location). */
export const browserLocationAvailable =
  isWeb && typeof navigator !== 'undefined' && 'geolocation' in navigator;

/**
 * Hent enhedens position via BROWSERENS lokationstjeneste (GPS/WiFi-triangulering).
 * Den bruger IKKE IP → den er VPN-immun (modsat et IP-opslag, der ville returnere
 * Proton VPN's exit-node).
 */
export function fetchBrowserLocation(): Promise<UvPlace> {
  if (!browserLocationAvailable) {
    return Promise.reject(new Error('Lokationstjeneste ikke tilgængelig'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          id: 'min-position',
          name: 'Min position',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      (err) => reject(new Error(err.message || 'Kunne ikke hente din position')),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  });
}
