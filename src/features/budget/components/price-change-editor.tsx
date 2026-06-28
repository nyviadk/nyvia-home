import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { formatMonthCopenhagen } from '@/lib/datetime';
import { parseKronerInput } from '@/lib/money';
import { Pressable, View } from '@/tw';
import type { PriceChange } from '../types';

const schema = z.object({
  fromYm: z.string().regex(/^\d{4}-\d{2}$/, 'Brug ÅÅÅÅ-MM'),
  amount: z.string().refine((s) => {
    const ore = parseKronerInput(s);
    return ore !== null && ore >= 0;
  }, 'Beløb kræves'),
});
type Values = z.infer<typeof schema>;

function sortChanges(changes: PriceChange[]): PriceChange[] {
  return [...changes].sort((a, b) => a.fromYm.localeCompare(b.fromYm));
}

/**
 * "Denne og fremover": tilføj en prisændring fra og med en måned. Påvirker ikke
 * fortiden (forecasten bruger den seneste ændring <= måneden).
 */
export function PriceChangeEditor({
  changes,
  onSave,
}: {
  changes: PriceChange[];
  onSave: (changes: PriceChange[]) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fromYm: '', amount: '' } });

  const add = handleSubmit(async (values) => {
    const next = sortChanges([
      ...changes.filter((c) => c.fromYm !== values.fromYm),
      { fromYm: values.fromYm, amountOre: parseKronerInput(values.amount) ?? 0 },
    ]);
    await onSave(next);
    reset({ fromYm: '', amount: '' });
  });

  const remove = (fromYm: string) => onSave(changes.filter((c) => c.fromYm !== fromYm));

  return (
    <View className="gap-3">
      <AppText variant="heading">Prisændringer (denne og fremover)</AppText>
      {changes.length > 0 ? (
        <View className="gap-2">
          {sortChanges(changes).map((c) => (
            <Card key={c.fromYm} className="flex-row items-center justify-between gap-3 py-3">
              <View className="flex-1">
                <MoneyText ore={c.amountOre} whole variant="label" />
                <AppText variant="muted" className="capitalize">
                  fra {formatMonthCopenhagen(`${c.fromYm}-01`)}
                </AppText>
              </View>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => remove(c.fromYm)}>
                <AppText className="text-sm text-danger">Fjern</AppText>
              </Pressable>
            </Card>
          ))}
        </View>
      ) : (
        <AppText variant="muted">Ingen — prisen er den samme hele vejen.</AppText>
      )}

      <Card className="gap-3">
        <Controller
          control={control}
          name="fromYm"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Gælder fra (ÅÅÅÅ-MM)" error={errors.fromYm?.message}>
              <Input
                value={value}
                onChangeText={(t) => onChange(t.slice(0, 7))}
                onBlur={onBlur}
                placeholder="2027-01"
                autoCapitalize="none"
              />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Ny pris (kr.)" error={errors.amount?.message}>
              <MoneyInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="0" />
            </FormField>
          )}
        />
        <Button title="Tilføj prisændring" onPress={add} loading={isSubmitting} />
      </Card>
    </View>
  );
}
