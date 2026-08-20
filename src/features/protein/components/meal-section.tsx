import { Link } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { fitMark } from '../balance';
import type { FitMark, Totals } from '../balance';
import { dk } from '../format';
import type { MealSlot, ProteinFood, ProteinLogEntry, ProteinSettings } from '../types';
import { mealLabel, serving } from '../types';

/**
 * Én række: navn til venstre, tal til højre, `×N` når den er taget, og en `−` til at fjerne.
 *
 * Rækken er BÅDE knappen der tilføjer og visningen af hvad der er taget. Det var to lister
 * før — en at vælge fra og en over det spiste — og så skulle man lede det samme sted to
 * gange for at finde ud af om man havde fået det.
 */
function Row({
  name,
  proteinG,
  kcal,
  count,
  mark,
  onAdd,
  onRemove,
  href,
}: {
  name: string;
  proteinG: number;
  kcal: number;
  count: number;
  /** Kun sat på katalog-rækker; løse poster er allerede spist. */
  mark?: FitMark;
  onAdd?: () => void;
  onRemove?: () => void;
  /** Sat på løse poster: de kan ikke tilføjes igen, men de kan redigeres. */
  href?: { pathname: '/protein/log/[id]'; params: { id: string } };
}) {
  const body = (
    <View className="flex-1 flex-row items-center gap-2">
      <AppText
        className={cn('flex-1 text-sm leading-snug', count > 0 ? 'text-fg' : 'text-fg')}
        numberOfLines={2}>
        {name}
      </AppText>
      {count > 1 ? (
        <View className="rounded-sm bg-accent-protein px-1.5 py-0.5">
          <AppText className="text-[11px] font-semibold text-card">×{count}</AppText>
        </View>
      ) : null}
      {/* Mærket står FØR tallene: det er det man skimmer efter, tallene slår man efter
          bagefter. Intet mærke er den midterste tilstand og skal ikke fylde noget. */}
      {mark === 'ok' ? (
        <AppText accessibilityLabel="Passer" className="text-xs text-success">
          {'▲'}
        </AppText>
      ) : mark === 'undgå' ? (
        <AppText accessibilityLabel="Undgå" className="text-xs text-danger">
          {'●'}
        </AppText>
      ) : null}
      <View className="items-end">
        <AppText
          className={cn(
            'text-[13px] font-medium',
            count > 0 ? 'text-accent-protein' : 'text-fg-muted'
          )}>
          {proteinG} g
        </AppText>
        <AppText variant="muted" className="text-[10px]">
          {dk(kcal)} kcal
        </AppText>
      </View>
    </View>
  );

  return (
    <View
      className={cn(
        'mb-1.5 flex-row items-center gap-2 rounded-lg border p-2.5',
        count > 0 ? 'border-accent-protein bg-accent-protein/10' : 'border-border bg-card'
      )}
      style={{ borderCurve: 'continuous' }}>
      {href ? (
        <Link href={href} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Redigér ${name}`}
            className="flex-1 flex-row active:opacity-60">
            {body}
          </Pressable>
        </Link>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tilføj ${name}, ${proteinG} gram protein, ${kcal} kalorier`}
          onPress={onAdd}
          className="flex-1 flex-row active:opacity-60">
          {body}
        </Pressable>
      )}

      {count > 0 && onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Fjern én ${name}`}
          hitSlop={6}
          onPress={onRemove}
          className="h-7 w-7 items-center justify-center rounded border border-border active:bg-element">
          <AppText className="text-base leading-none text-fg-muted">−</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Ét måltid: overskrift med dagens delsum, dine retter, og de løse poster der ikke kommer
 * fra kataloget (ukendt måltid, eller en ret der er slettet siden).
 */
export function MealSection({
  slot,
  foods,
  entries,
  totals,
  settings,
  onAdd,
  onRemoveOne,
}: {
  slot: MealSlot;
  foods: readonly WithId<ProteinFood>[];
  entries: readonly WithId<ProteinLogEntry>[];
  /** Dagens sum indtil nu — trekanten afhænger af hvad der er tilbage. */
  totals: Totals;
  settings: ProteinSettings;
  onAdd: (food: WithId<ProteinFood>) => void;
  onRemoveOne: (entry: WithId<ProteinLogEntry>) => void;
}) {
  const mine = foods.filter((f) => f.meal === slot && !f.hidden);
  const logged = entries.filter((e) => e.meal === slot);

  const forFood = (foodId: string) => logged.filter((e) => e.foodId === foodId);
  const loose = logged.filter((e) => !e.foodId || !mine.some((f) => f.id === e.foodId));

  if (mine.length === 0 && loose.length === 0) return null;

  const protein = logged.reduce((n, e) => n + e.proteinG * e.qty, 0);
  const kcal = logged.reduce((n, e) => n + e.kcal * e.qty, 0);

  return (
    <View className="pt-5">
      <View className="mb-2 flex-row items-center gap-2.5">
        <AppText variant="muted" className="text-[11px] font-semibold uppercase tracking-widest">
          {mealLabel(slot)}
        </AppText>
        <View className="h-px flex-1 bg-border" />
        <AppText variant="muted" className="text-[11px]">
          {protein || kcal ? `${Math.round(protein)} g · ${dk(kcal)} kcal` : '—'}
        </AppText>
      </View>

      {mine.map((food) => {
        const rows = forFood(food.id);
        const count = rows.reduce((n, e) => n + e.qty, 0);
        const per = serving(food);
        return (
          <Row
            key={food.id}
            name={food.name}
            proteinG={per.proteinG}
            kcal={per.kcal}
            count={count}
            mark={fitMark(per, totals, settings)}
            onAdd={() => onAdd(food)}
            // Den sidst tilføjede fjernes først — det er den man lige har trykket forkert på.
            onRemove={rows.length ? () => onRemoveOne(rows[rows.length - 1]) : undefined}
          />
        );
      })}

      {loose.map((entry) => (
        <Row
          key={entry.id}
          name={entry.estimated ? `${entry.name} (skøn)` : entry.name}
          proteinG={entry.proteinG}
          kcal={entry.kcal}
          count={entry.qty}
          href={{ pathname: '/protein/log/[id]', params: { id: entry.id } }}
          onRemove={() => onRemoveOne(entry)}
        />
      ))}
    </View>
  );
}
