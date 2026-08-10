import type { CardGridProps } from './card-grid.types';

/**
 * Responsivt kort-grid på web — som rigtigt CSS-grid, uden at måle noget.
 *
 * Den målende variant (se `card-grid.tsx`) kan først lægge kortene rigtigt i ANDEN render:
 * første frame males på gæt, `onLayout` rapporterer bredden bagefter, og så hopper layoutet.
 * Det var flickeret på den delte ønskeliste — værst når man kom tilbage til oversigten, fordi
 * expo-router lader skærmene bagved blive stående med `display:none`, hvor de måles som 0 × 0.
 * Browseren kender selv containerens bredde, så her findes problemet ikke: korrekt i første
 * frame, og vindues-ændringer klares uden en eneste re-render.
 *
 * Spor-formlen er hvad `maxColumns` betyder oversat til CSS: `(100% − alle gaps) / N` er
 * bredden af én kolonne NÅR der er N af dem. Er der plads til det, giver `auto-fill` præcis N;
 * ellers vinder `minColumnWidth` og der bliver færre. `auto-fill` og ikke `auto-fit`, så et
 * enkelt kort bliver stående i sin egen kolonnebredde i stedet for at strække sig ud over
 * hele rækken.
 */
export function CardGrid<T>({
  items,
  keyOf,
  renderItem,
  gap = 20,
  minColumnWidth = 300,
  maxColumns = 3,
}: CardGridProps<T>) {
  const column = `max(${minColumnWidth}px, (100% - ${gap * (maxColumns - 1)}px) / ${maxColumns})`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${column}, 1fr))`,
        gap,
      }}>
      {items.map((item) => (
        // Grid-cellen strækkes til rækkens højde, så kortenes `h-full` får noget at måle
        // sig imod — det er dét, der holder kortene i samme højde række for række.
        <div key={keyOf(item)} style={{ display: 'flex', flexDirection: 'column' }}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
