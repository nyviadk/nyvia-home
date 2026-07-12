import { AppText } from '@/components/ui/text';
import { ScrollView, Text, View } from '@/tw';
import type { UvPoint } from '../types';
import { crossingTime, formatHour, UV_RISK_THRESHOLD, uvLevel } from '../uv.utils';

const BAR_AREA = 40;

/**
 * UV-forløbet i KVARTERS-skridt (Open-Meteos 15-min serie — deres fineste opløsning).
 *
 * Værdier over 3 vises i fed, og hvor kurven KRYDSER 3 sættes et mærke med det præcise
 * minut-tidspunkt (↑ 09:09 / ↓ 17:57). Det er interpoleret mellem de to omkringliggende
 * målepunkter — samme tal som dag-oversigten viser, så graf og tekst altid stemmer.
 *
 * Skalaen er `max(dagens top, 3)`: er toppen under 3 (ufarligt), bliver søjlerne ærligt
 * korte men stadig synlige; er den over 3, skaleres der til den så dagens form kan læses.
 */
export function HourStrip({ label, points }: { label: string; points: UvPoint[] }) {
  if (points.length === 0) return null;

  const peak = Math.max(...points.map((p) => p.uv));
  const scale = Math.max(peak, UV_RISK_THRESHOLD);
  const risky = (uv: number) => uv >= UV_RISK_THRESHOLD;

  return (
    <View className="gap-1.5">
      <AppText variant="muted" className="text-xs">
        {label}
      </AppText>
      {/* flex-row EKSPLICIT: contentContainerClassName kompilerer ellers til RN's default
          flexDirection:column, som overskriver `horizontal` → lodret stak. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-2 pr-2">
        {points.map((p, i) => {
          const level = uvLevel(p.uv);
          const height = Math.max(3, Math.round((p.uv / scale) * BAR_AREA));
          const critical = risky(p.uv);

          // Krydser kurven 3 mellem forrige punkt og dette? Så vis det præcise minut.
          const prev = i > 0 ? points[i - 1] : null;
          const up = prev !== null && !risky(prev.uv) && critical;
          const down = prev !== null && risky(prev.uv) && !critical;
          const mark =
            prev !== null && (up || down)
              ? `${up ? '↑' : '↓'} ${formatHour(crossingTime(prev, p, UV_RISK_THRESHOLD))}`
              : null;

          return (
            <View key={p.t} className="items-center gap-1" style={{ width: 44 }}>
              <Text
                style={{ color: level.color }}
                className={critical ? 'text-xs font-bold' : 'text-xs'}>
                {p.uv.toFixed(2)}
              </Text>
              <View className="justify-end" style={{ height: BAR_AREA }}>
                <View
                  style={{ height, width: 8, borderRadius: 4, backgroundColor: level.color }}
                />
              </View>
              <AppText variant="muted" className="text-xs">
                {formatHour(p.t)}
              </AppText>
              {mark ? (
                <Text className="text-xs font-semibold text-danger" numberOfLines={1}>
                  {mark}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
