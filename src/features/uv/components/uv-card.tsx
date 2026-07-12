import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Pressable, Switch, Text, View } from '@/tw';
import { refreshUv, setNotifyPlace, setUvNotifyEnabled, useUvStore } from '../data/uv-store';
import { aggregateSnapshots, shortPlaceName, UV_ALERT_LEAD_MIN } from '../uv.utils';
import { FreshnessLine } from './freshness-line';
import { PlaceCompare } from './place-compare';
import { PlacePicker } from './place-picker';
import { UsageLine } from './usage-line';
import { UvSummary } from './uv-summary';

const isNative = process.env.EXPO_OS !== 'web';

/**
 * UV-sektion til forsiden. Viser UV UDEN skyer (clear-sky = det direkte maksimum).
 *
 * Ét FÆLLES overblik på tværs af alle gemte steder (worst case = højeste UV pr. tidspunkt) —
 * steder tæt på hinanden følges ad, så separate blokke pr. sted var ren støj. Nedenunder
 * sammenlignes stederne, og der siges til hvis ét skiller sig markant ud.
 *
 * - Auto-hent når forsiden åbnes (kun her — ingen anden skærm kalder API'et).
 * - Native: henter også friskt når appen kommer i forgrunden.
 */
export function UvCard() {
  const places = useUvStore((s) => s.places);
  const snapshots = useUvStore((s) => s.snapshots);
  const loading = useUvStore((s) => s.loading);
  const error = useUvStore((s) => s.error);
  const notifyEnabled = useUvStore((s) => s.notifyEnabled);
  const notifyPlaceId = useUvStore((s) => s.notifyPlaceId);
  const usage = useUvStore((s) => s.usage);

  const [showPlaces, setShowPlaces] = useState(false);

  useEffect(() => {
    void refreshUv();
  }, []);

  useEffect(() => {
    if (!isNative) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshUv();
    });
    return () => sub.remove();
  }, []);

  const available = places.map((p) => snapshots[p.id]).filter((s): s is NonNullable<typeof s> => !!s);
  const combined = aggregateSnapshots(available);

  return (
    <Card className="gap-4">
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <AppText variant="heading">UV uden skyer</AppText>
            <AppText variant="muted" numberOfLines={1}>
              {places.length > 0
                ? `${places.length} ${places.length === 1 ? 'sted' : 'steder'} · højeste værdi`
                : 'Clear-sky — det direkte maksimum'}
            </AppText>
          </View>
          <View className="flex-row items-center gap-2">
            <Button
              title="Steder"
              variant="ghost"
              className="h-10 px-3"
              onPress={() => setShowPlaces((v) => !v)}
            />
            {places.length > 0 ? (
              <Button
                title="Hent frisk"
                variant="secondary"
                className="h-10 px-4"
                loading={loading}
                onPress={() => void refreshUv(true)}
              />
            ) : null}
          </View>
        </View>

        {/* Hentet-/næste-data-tidspunkt hører sammen med "Hent frisk" — derfor herop. */}
        {combined ? <FreshnessLine snapshot={combined} /> : null}
      </View>

      {combined ? <UvSummary snapshot={combined} /> : null}

      <PlaceCompare places={places} snapshots={snapshots} />

      {showPlaces || places.length === 0 ? <PlacePicker /> : null}

      {isNative && places.length > 0 ? (
        <View className="gap-2 border-t border-border pt-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <AppText variant="label">Varsl mig før UV rammer 3</AppText>
              <AppText variant="muted">
                Lokalt varsel {UV_ALERT_LEAD_MIN} min før UV rammer 3 — og igen når det falder
                under (så du ved, du ikke behøver solcreme mere).
              </AppText>
            </View>
            <Switch value={notifyEnabled} onValueChange={(v) => void setUvNotifyEnabled(v)} />
          </View>

          {/* Telefonen ved ikke hvor du er — så varslerne skal knyttes til ét bestemt sted. */}
          {notifyEnabled && places.length > 1 ? (
            <View className="gap-1.5">
              <AppText variant="muted" className="text-xs">
                Varsl for hvilket sted?
              </AppText>
              <View className="flex-row flex-wrap gap-2">
                {places.map((p) => {
                  const on = p.id === notifyPlaceId;
                  return (
                    <Pressable
                      key={p.id}
                      accessibilityRole="button"
                      onPress={() => void setNotifyPlace(p.id)}
                      style={{ borderCurve: 'continuous' }}
                      className={cn(
                        'rounded-full border px-3 py-1.5',
                        on ? 'border-primary bg-primary' : 'border-border bg-card hover:bg-element',
                      )}>
                      <Text
                        numberOfLines={1}
                        style={{ maxWidth: 140 }}
                        className={cn('text-xs', on ? 'font-medium text-on-primary' : 'text-fg')}>
                        {shortPlaceName(p.name)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? <AppText className="text-sm text-danger">{error}</AppText> : null}

      <UsageLine usage={usage} />
    </Card>
  );
}
