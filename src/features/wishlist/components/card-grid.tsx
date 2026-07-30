import { useState, type ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import { View } from '@/tw';

/**
 * Responsivt kort-grid med EXAKTE mellemrum.
 *
 * Procent-bredder + `gap` løber over (3 × 33% + 2 gaps > 100%), og negative margener slås med
 * forældrenes egne gaps. Derfor måles containerens bredde én gang, og kortenes bredde regnes i
 * pixels — så mellemrummene bliver præcis dem, designet siger.
 */
export function CardGrid<T>({
  items,
  keyOf,
  renderItem,
  gap = 20,
  minColumnWidth = 300,
  maxColumns = 3,
}: {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  gap?: number;
  /** Under denne bredde falder grid'et til færre kolonner. */
  minColumnWidth?: number;
  maxColumns?: number;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const columns = width
    ? Math.max(1, Math.min(maxColumns, Math.floor((width + gap) / (minColumnWidth + gap))))
    : 1;
  const cardWidth = width ? (width - gap * (columns - 1)) / columns : undefined;

  return (
    <View onLayout={onLayout} className="flex-row flex-wrap" style={{ gap }}>
      {items.map((item) => (
        // Indtil første måling er bredden undefined → ét kort pr. række (ingen synligt spring).
        <View key={keyOf(item)} style={{ width: cardWidth }}>
          {renderItem(item)}
        </View>
      ))}
    </View>
  );
}
