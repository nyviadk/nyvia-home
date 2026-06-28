import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { MoneyInput } from '@/components/ui/money-input';
import { MoneyText } from '@/components/ui/money-text';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { formatMonthCopenhagen, todayISODate } from '@/lib/datetime';
import { oreToInput, parseKronerInput } from '@/lib/money';
import { View } from '@/tw';
import { setSavingsActuals } from '../data/budget-settings.repository';
import { useBudgetSettingsStore } from '../data/budget-settings-store';
import { monthForecast } from '../forecast';
import { useForecastInput } from '../hooks/use-forecast';
import { effectiveSavingsPercent } from '../pricing';

const schema = z.object({
  amount: z.string().refine((s) => parseKronerInput(s) !== null, 'Beløb kræves'),
});
type Values = z.infer<typeof schema>;

/** Sæt faktisk opsparing for en måned (overstyrer procenten). Negativt = hævet fra opsparing. */
export function SavingsEditorScreen({ ym }: { ym: string }) {
  const input = useForecastInput();
  const savingsActuals = useBudgetSettingsStore((s) => s.savingsActuals);
  const savingsPercent = useBudgetSettingsStore((s) => s.savingsPercent);
  const savingsPercentChanges = useBudgetSettingsStore((s) => s.savingsPercentChanges);

  const [year, month] = ym.split('-').map((n) => Number.parseInt(n, 10));
  // Faktisk kan først indtastes når måneden i virkeligheden er begyndt.
  const isFuture = ym > todayISODate().slice(0, 7);
  // baseNet for måneden (rådighedsbeløb før opsparing), realistisk med faktiske beløb.
  const { baseNet } = monthForecast(year, month, input, 'realistic', true);
  const pct = effectiveSavingsPercent(savingsPercent, savingsPercentChanges, ym);
  const plannedSavings = pct > 0 && baseNet > 0 ? Math.round((baseNet * pct) / 100) : 0;
  const override = savingsActuals[ym];

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: override !== undefined ? oreToInput(override) : oreToInput(plannedSavings) },
  });

  const save = handleSubmit(async (values) => {
    await setSavingsActuals({ ...savingsActuals, [ym]: parseKronerInput(values.amount) ?? 0 });
    router.back();
  });

  const reset = async () => {
    const next = { ...savingsActuals };
    delete next[ym];
    await setSavingsActuals(next);
    router.back();
  };

  return (
    <Screen>
      <View className="gap-1">
        <AppText variant="title">Opsparing</AppText>
        <AppText variant="muted" className="capitalize">
          {formatMonthCopenhagen(`${ym}-01`)}
        </AppText>
      </View>

      <Card className="gap-2">
        <View className="flex-row items-baseline justify-between">
          <AppText variant="muted">Rådighedsbeløb før opsparing</AppText>
          <MoneyText ore={baseNet} whole variant="label" />
        </View>
        <View className="flex-row items-baseline justify-between">
          <AppText variant="muted">Forventet opsparing ({pct}%)</AppText>
          <MoneyText ore={plannedSavings} whole variant="label" />
        </View>
      </Card>

      {isFuture ? (
        <AppText variant="muted">
          Du kan først indtaste faktisk opsparing når måneden er begyndt. Indtil da bruges den
          forventede opsparing.
        </AppText>
      ) : (
        <>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Faktisk opsparing (kr.) — negativ = hævet"
                error={errors.amount?.message}>
                <MoneyInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numbers-and-punctuation"
                  placeholder="0"
                />
              </FormField>
            )}
          />
          <Button title="Gem faktisk opsparing" onPress={save} loading={isSubmitting} />
          {override !== undefined ? (
            <Button title="Nulstil til forventet" variant="secondary" onPress={reset} />
          ) : null}
        </>
      )}
    </Screen>
  );
}
