import { Card } from '@/components/ui/card';
import { DeleteRowButton } from '@/components/ui/delete-row-button';
import { SelectField } from '@/components/ui/select-field';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { useAddressChangesStore } from '../data/address-changes-store';
import {
  deleteAddressChange,
  setAddressChangeStatus,
} from '../data/address-changes.repository';
import {
  ADDRESS_CHANGE_STATUSES,
  STATUS_TONE,
  type AddressChange,
  type AddressChangeStatus,
  type StatusTone,
} from '../types';

/** Rød (ikke startet) · gul (afventer) · grøn (færdig). Statiske klasser → Tailwind-compileren ser dem. */
const TONE_DOT: Record<StatusTone, string> = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
};

export function AddressChangeRow({ change }: { change: WithId<AddressChange> }) {
  return (
    <Card className="flex-row items-center gap-3">
      <View className={`h-2.5 w-2.5 rounded-full ${TONE_DOT[STATUS_TONE[change.status]]}`} />
      <AppText variant="label" className="flex-1">
        {change.name}
      </AppText>
      <View className="w-40">
        <SelectField<AddressChangeStatus>
          value={change.status}
          options={ADDRESS_CHANGE_STATUSES}
          onChange={(status) => setAddressChangeStatus(change.id, status)}
        />
      </View>
      <DeleteRowButton
        id={change.id}
        title="Slet adresseændring"
        name={change.name}
        pending={useAddressChangesStore.pending}
        remove={() => deleteAddressChange(change.id)}
      />
    </Card>
  );
}
