import { Segmented } from '@/components/ui/segmented';
import type { WithId } from '@/lib/firebase';
import { updateCustomHorizon } from '../../data/loans.repository';
import type { CustomLoan, RepaymentHorizon } from '../types';

const options = [
  { value: 'asap' as const, label: 'Hurtigst' },
  { value: 'm24' as const, label: '24 mdr' },
  { value: 'm48' as const, label: '48 mdr' },
];

/** Dynamisk horisont-valg i afbetalingsplanen; gemmes og genberegner planen live. */
export function HorizonSelect({ loan }: { loan: WithId<CustomLoan> }) {
  return (
    <Segmented
      value={loan.horizon}
      options={options}
      onChange={(horizon: RepaymentHorizon) => {
        if (horizon !== loan.horizon) void updateCustomHorizon(loan.id, horizon);
      }}
    />
  );
}
