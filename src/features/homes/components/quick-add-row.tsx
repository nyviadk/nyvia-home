import type { RefObject } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { View } from '@/tw';

/** Inputfelt + "Tilføj"-knap til hurtig tilføjelse (todo, adresseændringer). */
export function QuickAddRow({
  value,
  onChangeText,
  onAdd,
  placeholder,
  inputRef,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: () => void;
  placeholder: string;
  inputRef?: RefObject<RNTextInput | null>;
}) {
  return (
    <View className="flex-row gap-2">
      <View className="flex-1">
        <Input
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onSubmitEditing={onAdd}
          returnKeyType="done"
          blurOnSubmit={false}
        />
      </View>
      <Button title="Tilføj" className="h-12 px-4" onPress={onAdd} />
    </View>
  );
}
