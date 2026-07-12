import * as Notifications from 'expo-notifications';

import type { UvSnapshot } from './types';
import {
  formatHour,
  minutesToBurn,
  UV_ALERT_LEAD_MIN,
  UV_RISK_THRESHOLD,
  uvWindows,
} from './uv.utils';

/**
 * NATIVE lokale UV-varsler. Web bruger `notifications.web.ts` (no-op), så
 * `expo-notifications` aldrig importeres i browseren.
 */
/**
 * NB: Android-kanaler er UFORANDERLIGE efter oprettelse — importance kan ikke hæves bagefter
 * i kode (kun af brugeren i systemindstillinger). Ændres `importance` nedenfor nogensinde,
 * SKAL dette id bumpes, ellers beholder eksisterende installationer den gamle indstilling.
 */
const CHANNEL_ID = 'uv-alerts';

/**
 * Vis varsler OGSÅ mens appen er åben (forgrunden) — ellers ville man ikke se advarslen,
 * netop mens man sidder og kigger på UV-kortet.
 *
 * NB (fra Expo-docs, SDK 56): på Android betyder `shouldPlaySound: false`, at drop-down-
 * banneret slet IKKE vises — uanset prioritet. Derfor SKAL lyd være slået til her, ellers
 * er der ingen synlig advarsel i forgrunden.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;

  if (process.env.EXPO_OS === 'android') {
    // HIGH (ikke DEFAULT): kun HIGH giver et heads-up-banner der popper op. DEFAULT lægger
    // den blot lydløst i notifikations-skuffen — ubrugeligt til en solskoldnings-advarsel.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'UV-varsler',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return true;
}

export async function cancelUvAlerts(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  // Lokale notifikationer (ikke DB-writes) → Promise.all er fint her.
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
  );
}

function scheduleAt(title: string, body: string, unixSeconds: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(unixSeconds * 1000),
      channelId: CHANNEL_ID,
    },
  });
}

/**
 * To varsler pr. sol-vindue:
 *  - START: 30 min FØR UV rammer 3 ("find solcremen"). Er der mindre end 30 min til, sendes
 *    det snarest muligt med den faktiske resttid i titlen.
 *  - SLUT: præcis når UV falder under 3 ("du behøver den ikke mere") — ingen forvarsel.
 *
 * Kun fremtidige tidspunkter; tidligere varsler annulleres først, så vi ikke ophober dubletter.
 * Rent lokalt — ingen server/push/enheds-sync.
 */
export async function scheduleUvAlerts(
  snapshot: UvSnapshot,
  previousIds: string[],
): Promise<string[]> {
  await cancelUvAlerts(previousIds);

  const nowSec = Math.floor(Date.now() / 1000);
  const leadSec = UV_ALERT_LEAD_MIN * 60;
  const burnAt3 = minutesToBurn(UV_RISK_THRESHOLD) ?? 20;
  const ids: string[] = [];

  for (const w of uvWindows(snapshot.series ?? [], UV_RISK_THRESHOLD)) {
    if (w.start > nowSec) {
      // Normalt 30 min før. Er vi tættere på, så send snarest — men aldrig efter starten.
      const alertAt = Math.max(w.start - leadSec, nowSec + 60);
      const minsAhead = Math.round((w.start - alertAt) / 60);
      ids.push(
        await scheduleAt(
          `☀️ Solcreme om ${minsAhead} min`,
          `UV rammer 3 kl. ${formatHour(w.start)}. Sart hud (type 1): ca. ${burnAt3} min ubeskyttet.`,
          alertAt,
        ),
      );
    }
    if (w.end > nowSec) {
      ids.push(
        await scheduleAt(
          'UV er under 3 igen',
          'Du behøver ikke solcreme mere.',
          w.end,
        ),
      );
    }
  }
  return ids;
}
