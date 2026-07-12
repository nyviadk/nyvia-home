import { useState } from 'react';

import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';
import type { UvPlace, UvSnapshot } from '../types';
import { daySummaries, shortPlaceName, uvLevel } from '../uv.utils';
import { DayRow } from './day-row';

/** Hvor meget må dagens maks afvige, før et sted "skiller sig ud"? */
const SPREAD_TOLERANCE = 0.5;

/**
 * Steds-sammenligning. Overblikket ovenfor er worst case på tværs; her ser man dagens maks
 * pr. sted — og kan trykke på et sted for at få DETS egen dag-for-dag-oversigt, hvis man skal
 * være sikker på ét bestemt sted. Der siges desuden til, hvis ét sted skiller sig markant ud.
 */
export function PlaceCompare({
  places,
  snapshots,
}: {
  places: UvPlace[];
  snapshots: Record<string, UvSnapshot>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = places
    .map((place) => ({ place, snap: snapshots[place.id] }))
    .filter((r): r is { place: UvPlace; snap: UvSnapshot } => Boolean(r.snap))
    .map((r) => ({ place: r.place, snap: r.snap, todayMax: r.snap.daily[0]?.max ?? 0 }));

  if (rows.length < 2) return null;

  const values = rows.map((r) => r.todayMax);
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const similar = highest - lowest <= SPREAD_TOLERANCE;
  const top = rows.reduce((a, b) => (b.todayMax > a.todayMax ? b : a));
  const expanded = rows.find((r) => r.place.id === expandedId) ?? null;

  return (
    <View className="gap-1.5 border-t border-border pt-3">
      <AppText variant="muted" className="text-xs">
        Maks i dag pr. sted — tryk for detaljer
      </AppText>

      <View className="flex-row flex-wrap gap-2">
        {rows.map((r) => {
          const level = uvLevel(r.todayMax);
          const standsOut = !similar && r.place.id === top.place.id;
          const open = r.place.id === expandedId;
          return (
            <Pressable
              key={r.place.id}
              accessibilityRole="button"
              onPress={() => setExpandedId((id) => (id === r.place.id ? null : r.place.id))}
              style={{ borderCurve: 'continuous' }}
              className={cn(
                'flex-row items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-element',
                open
                  ? 'border-primary bg-element'
                  : standsOut
                    ? 'border-danger bg-element'
                    : 'border-border',
              )}>
              <Text numberOfLines={1} style={{ maxWidth: 120 }} className="text-xs text-fg">
                {shortPlaceName(r.place.name)}
              </Text>
              <Text style={{ color: level.color }} className="text-xs font-semibold">
                {r.todayMax.toFixed(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="muted" className="text-xs">
        {similar
          ? `Alle ${rows.length} steder er stort set ens (maks ${lowest.toFixed(1)}–${highest.toFixed(1)}).`
          : `${shortPlaceName(top.place.name)} skiller sig ud: maks ${highest.toFixed(1)} mod ${lowest.toFixed(1)} lavest.`}
      </AppText>

      {expanded ? (
        <View className="gap-0.5 pt-1">
          <AppText variant="label" numberOfLines={1}>
            {shortPlaceName(expanded.place.name)}
          </AppText>
          {daySummaries(expanded.snap).map((d) => (
            <DayRow key={d.t} day={d} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
