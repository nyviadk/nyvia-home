import { Controller, useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { formatMonthCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { oreToKroner, parseKronerInput } from '@/lib/money';
import { View } from '@/tw';
import { updateCustomActuals } from '../../data/loans.repository';
import { buildSchedule } from '../calc';
import type { CustomLoan } from '../types';

/**
 * Afbetalingstabel: forventet + faktisk afdrag (redigerbart) + restgæld pr. måned.
 * Faktiske afdrag gemmes automatisk når et felt forlades (on blur) — ingen Gem-knap.
 */
export function ScheduleActuals({ loan }: { loan: WithId<CustomLoan> }) {
  const rows = buildSchedule(loan);

  const defaultValues: Record<string, string> = {};
  for (const row of rows) {
    defaultValues[row.ym] = row.actual != null ? String(oreToKroner(row.actual).toNumber()) : '';
  }

  const { control } = useForm<Record<string, string>>({ defaultValues });

  /** Gem ét månedsafdrag (merge ind i de eksisterende). Tomt felt → fjern. */
  function saveMonth(ym: string, raw: string) {
    const ore = parseKronerInput(raw);
    const next = { ...loan.actuals };
    if (ore === null) {
      delete next[ym];
    } else {
      next[ym] = ore;
    }
    void updateCustomActuals(loan.id, next);
  }

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
              className={cn('text-xs', row.remaining <= 0 ? 'text-success' : 'text-fg-muted')}
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
                  onBlur={() => {
                    onBlur();
                    saveMonth(row.ym, value ?? '');
                  }}
                  keyboardType="decimal-pad"
                  placeholder="—"
                />
              )}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
