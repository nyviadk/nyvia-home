import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { formatMonthCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { oreToKroner, parseKronerInput } from '@/lib/money';
import { cn } from '@/lib/cn';
import { View } from '@/tw';
import { updateCustomActuals } from '../../data/loans.repository';
import { buildSchedule } from '../calc';
import type { CustomLoan } from '../types';

/** Afbetalingstabel: forventet afdrag + faktisk (redigerbart) + restgæld pr. måned. */
export function ScheduleActuals({ loan }: { loan: WithId<CustomLoan> }) {
  const rows = buildSchedule(loan);

  const defaultValues: Record<string, string> = {};
  for (const row of rows) {
    defaultValues[row.ym] = row.actual != null ? String(oreToKroner(row.actual).toNumber()) : '';
  }

  const { control, handleSubmit, formState } = useForm<Record<string, string>>({ defaultValues });

  const submit = handleSubmit(async (values) => {
    const actuals: Record<string, number> = {};
    for (const [ym, str] of Object.entries(values)) {
      // Tom/slettet felt → parseKronerInput giver null → springes over (måneden
      // bruger så forventet afdrag). "0" gemmes derimod som 0.
      const ore = parseKronerInput(str);
      if (ore !== null) actuals[ym] = ore;
    }
    await updateCustomActuals(loan.id, actuals);
  });

  if (rows.length === 0) {
    return <AppText variant="muted">Udfyld poster og udgifter for at se afbetalingsplanen.</AppText>;
  }

  return (
    <View className="gap-3">
      <View className="flex-row gap-2 px-1">
        <AppText variant="muted" className="flex-1">
          Måned
        </AppText>
        <AppText variant="muted" className="w-20 text-right">
          Forventet
        </AppText>
        <AppText variant="muted" className="w-24 text-right">
          Faktisk
        </AppText>
      </View>

      {rows.map((row) => (
        <View key={row.ym} className="flex-row items-center gap-2">
          <View className="flex-1">
            <AppText variant="label">{formatMonthCopenhagen(`${row.ym}-01`)}</AppText>
            <MoneyText
              ore={row.remaining}
              whole
              className={cn('text-xs', row.remaining <= 0 ? 'text-green-600' : 'text-fg-muted')}
            />
          </View>
          <MoneyText ore={row.expected} whole variant="muted" className="w-20 text-right" />
          <View className="w-24">
            <Controller
              control={control}
              name={row.ym}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="—"
                />
              )}
            />
          </View>
        </View>
      ))}

      <Button title="Gem faktiske afdrag" onPress={submit} loading={formState.isSubmitting} />
    </View>
  );
}
