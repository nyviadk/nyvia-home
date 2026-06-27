import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { genId } from '@/lib/id';
import { parseKronerInput } from '@/lib/money';
import { Pressable, View } from '@/tw';
import { updateBudgetActuals } from '../data/budget.repository';
import type { ActualLine } from '../types';

const lineSchema = z.object({
  amount: z.string().refine((s) => {
    const ore = parseKronerInput(s);
    return ore !== null && ore !== 0;
  }, 'Beløb kræves'),
  note: z.string().optional(),
});
type LineValues = z.infer<typeof lineSchema>;

/**
 * Redigerer de faktiske linjer for én post i én måned (fx mange mad-indkøb).
 * Skriver hele faktisk-kortet tilbage (merge af den valgte måned).
 */
export function ActualLinesEditor({
  entryId,
  monthYm,
  allActuals,
  lines,
}: {
  entryId: string;
  monthYm: string;
  allActuals: Record<string, ActualLine[]>;
  lines: ActualLine[];
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LineValues>({ resolver: zodResolver(lineSchema), defaultValues: { amount: '', note: '' } });

  const write = (nextLines: ActualLine[]) => {
    const next = { ...allActuals };
    if (nextLines.length > 0) next[monthYm] = nextLines;
    else delete next[monthYm];
    return updateBudgetActuals(entryId, next);
  };

  const addLine = handleSubmit(async (values) => {
    const line: ActualLine = {
      id: genId(),
      amountOre: parseKronerInput(values.amount) ?? 0,
      ...(values.note?.trim() ? { note: values.note.trim() } : {}),
    };
    await write([...lines, line]);
    reset({ amount: '', note: '' });
  });

  return (
    <View className="gap-3">
      {lines.length > 0 ? (
        <View className="gap-2">
          {lines.map((line) => (
            <Card key={line.id} className="flex-row items-center justify-between gap-3 py-3">
              <View className="flex-1">
                <MoneyText ore={line.amountOre} variant="label" />
                {line.note ? <AppText variant="muted">{line.note}</AppText> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => write(lines.filter((l) => l.id !== line.id))}>
                <AppText className="text-sm text-danger">Fjern</AppText>
              </Pressable>
            </Card>
          ))}
        </View>
      ) : (
        <AppText variant="muted">Ingen faktiske linjer endnu — bruger forventet.</AppText>
      )}

      <Card className="gap-3">
        <AppText variant="label">Tilføj faktisk linje</AppText>
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Beløb (kr.)" error={errors.amount?.message}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Note (valgfri)">
              <Input value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="Fx Netto" />
            </FormField>
          )}
        />
        <Button title="Tilføj linje" onPress={addLine} loading={isSubmitting} />
      </Card>
    </View>
  );
}
