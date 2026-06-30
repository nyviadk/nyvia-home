import { Card } from '@/components/ui/card';
import { SelectField } from '@/components/ui/select-field';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import {
  deleteAddressChange,
  setAddressChangeStatus,
} from '../data/address-changes.repository';
import { ADDRESS_CHANGE_STATUSES, type AddressChange, type AddressChangeStatus } from '../types';

export function AddressChangeRow({ change }: { change: WithId<AddressChange> }) {
  return (
    <Card className="flex-row items-center gap-3">
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
      <Pressable accessibilityRole="button" hitSlop={6} onPress={() => deleteAddressChange(change.id)}>
        <AppText className="text-sm text-danger">Slet</AppText>
      </Pressable>
    </Card>
  );
}
