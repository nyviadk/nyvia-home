import { type Control, Controller, type FieldErrors, useWatch } from 'react-hook-form';

import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/ui/money-text';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { parseKronerInput } from '@/lib/money';
import { View } from '@/tw';
import type { BudgetFormValues } from '../data/budget.schema';
import { salaryBreakdown } from '../salary';

const MODE_OPTIONS = [
  { value: 'net' as const, label: 'Efter skat' },
  { value: 'gross' as const, label: 'Før skat' },
];

const pct = (s: string) => {
  const n = Number.parseFloat(s.replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
};

/** Beløbsfelt for indtægter: direkte nettobeløb, eller løn-beregner (før skat → estimeret netto). */
export function SalaryAmountField({
  control,
  errors,
}: {
  control: Control<BudgetFormValues>;
  errors: FieldErrors<BudgetFormValues>;
}) {
  const mode = useWatch({ control, name: 'amountMode' });
  const gross = useWatch({ control, name: 'gross' });
  const amBidragPct = useWatch({ control, name: 'amBidragPct' });
  const fradrag = useWatch({ control, name: 'fradrag' });
  const traekPct = useWatch({ control, name: 'traekPct' });

  const breakdown = salaryBreakdown({
    grossOre: parseKronerInput(gross) ?? 0,
    amBidragPct: pct(amBidragPct),
    fradragOre: parseKronerInput(fradrag) ?? 0,
    traekPct: pct(traekPct),
  });

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="amountMode"
        render={({ field: { onChange, value } }) => (
          <FormField label="Beløb">
            <Segmented value={value} options={MODE_OPTIONS} onChange={onChange} />
          </FormField>
        )}
      />

      {mode === 'net' ? (
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Nettoløn / md (kr.)" error={errors.amount?.message}>
              <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="0" />
            </FormField>
          )}
        />
      ) : (
        <View className="gap-3">
          <Controller
            control={control}
            name="gross"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Bruttoløn / md (kr.)" error={errors.gross?.message}>
                <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="0" />
              </FormField>
            )}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="amBidragPct"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField label="AM-bidrag (%)" error={errors.amBidragPct?.message}>
                    <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="8" />
                  </FormField>
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="traekPct"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField label="Trækprocent (%)" error={errors.traekPct?.message}>
                    <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="38" />
                  </FormField>
                )}
              />
            </View>
          </View>
          <Controller
            control={control}
            name="fradrag"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Månedsfradrag (kr.)" error={errors.fradrag?.message}>
                <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="0" />
              </FormField>
            )}
          />

          <View className="gap-1 rounded-2xl border border-border bg-element p-3" style={{ borderCurve: 'continuous' }}>
            <View className="flex-row items-baseline justify-between">
              <AppText variant="label">Estimeret efter skat / md</AppText>
              <MoneyText ore={breakdown.netOre} whole variant="label" />
            </View>
            <View className="flex-row items-baseline justify-between">
              <AppText variant="muted">− AM-bidrag</AppText>
              <MoneyText ore={breakdown.amBidragOre} whole variant="muted" />
            </View>
            <View className="flex-row items-baseline justify-between">
              <AppText variant="muted">− A-skat</AppText>
              <MoneyText ore={breakdown.aSkatOre} whole variant="muted" />
            </View>
            <AppText variant="muted">Bruges som forventet løn indtil du kender den rigtige.</AppText>
          </View>
        </View>
      )}
    </View>
  );
}
