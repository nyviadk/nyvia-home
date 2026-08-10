import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import { View } from '@/tw';
import type { CardGridProps } from './card-grid.types';

/**
 * Responsivt kort-grid med EXAKTE mellemrum — native.
 *
 * Yoga har ikke CSS-grid, så bredden må måles: procent-bredder + `gap` løber over
 * (3 × 33 % + 2 gaps > 100 %), og negative margener slås med forældrenes egne gaps.
 * Web slipper for det hele og bruger et rigtigt grid, se `card-grid.web.tsx`.
 */
export function CardGrid<T>({
  items,
  keyOf,
  renderItem,
  gap = 20,
  minColumnWidth = 300,
  maxColumns = 3,
}: CardGridProps<T>) {
  const [width, setWidth] = useState(0);

  /**
   * Nul-bredder ignoreres, og en uændret bredde sætter ikke state: en skærm der er
   * navigeret væk fra måles som 0, og uden vagten ville grid'et falde til én kolonne mens
   * ingen kigger — og først rette sig et frame efter man kom tilbage.
   */
  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (next > 0 && next !== width) setWidth(next);
  };

  const columns = width
    ? Math.max(1, Math.min(maxColumns, Math.floor((width + gap) / (minColumnWidth + gap))))
    : 1;
  const cardWidth = width ? (width - gap * (columns - 1)) / columns : undefined;

  return (
    <View onLayout={onLayout} className="flex-row flex-wrap" style={{ gap }}>
      {items.map((item) => (
        // Indtil første måling er bredden undefined → ét kort pr. række. På en telefon er
        // det også slutresultatet, så springet ses reelt kun på en tablet.
        <View key={keyOf(item)} style={{ width: cardWidth }}>
          {renderItem(item)}
        </View>
      ))}
    </View>
  );
}
