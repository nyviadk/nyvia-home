import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { Pressable, Text, View } from '@/tw';
import { browserLocationAvailable, fetchBrowserLocation } from '../data/browser-location';
import { searchPlaces } from '../data/geocode';
import { addPlace, MAX_PLACES, removePlace, useUvStore } from '../data/uv-store';
import type { UvPlace } from '../types';

/**
 * Steds-styring: op til MAX_PLACES gemte steder — ALLE vises samtidig i kortet.
 * Koordinater slås op via Open-Meteos geocoding (du skriver et bynavn), så intet IP-opslag
 * er involveret → VPN-immun.
 */
export function PlacePicker() {
  const places = useUvStore((s) => s.places);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UvPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchPlaces(q));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const pick = async (p: UvPlace) => {
    setQuery('');
    setResults([]);
    await addPlace(p);
  };

  const useMyPosition = async () => {
    setLocating(true);
    try {
      await addPlace(await fetchBrowserLocation());
    } catch {
      // fejlen vises via storet
    } finally {
      setLocating(false);
    }
  };

  const full = places.length >= MAX_PLACES;

  return (
    <View className="gap-3 border-t border-border pt-3">
      <AppText variant="label">
        Steder ({places.length}/{MAX_PLACES})
      </AppText>

      {places.length > 0 ? (
        <View className="gap-1.5">
          {places.map((p) => (
            <View key={p.id} className="flex-row items-center gap-2">
              <View
                className="flex-1 rounded-xl border border-border bg-card px-3 py-2"
                style={{ borderCurve: 'continuous' }}>
                <Text numberOfLines={1} className="text-sm text-fg">
                  {p.name}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => void removePlace(p.id)}
                hitSlop={6}
                className="px-2 py-2">
                <Text className="text-fg-muted">✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="muted">Tilføj et sted for at se UV.</AppText>
      )}

      {full ? (
        <AppText variant="muted">
          Maks {MAX_PLACES} steder — fjern ét for at tilføje et nyt.
        </AppText>
      ) : (
        <View className="gap-1.5">
          <Input
            value={query}
            onChangeText={(q) => void search(q)}
            placeholder="Søg by (fx Tranbjerg)"
            autoCapitalize="words"
          />
          {searching ? <AppText variant="muted">Søger…</AppText> : null}
          {results.length > 0 ? (
            <View className="gap-1">
              {results.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => void pick(r)}
                  className="rounded-lg px-3 py-2 hover:bg-element active:bg-selected">
                  <Text numberOfLines={1} className="text-sm text-fg">
                    {r.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      )}

      {browserLocationAvailable ? (
        <Button
          title="Brug min position"
          variant="secondary"
          className="h-10"
          loading={locating}
          onPress={() => void useMyPosition()}
        />
      ) : null}
    </View>
  );
}
