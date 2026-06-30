import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { View } from '@/tw';

/** Inputfelt + "Tilføj"-knap til hurtig tilføjelse (todo, adresseændringer). */
export function QuickAddRow({
  value,
  onChangeText,
  onAdd,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <View className="flex-row gap-2">
      <View className="flex-1">
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
      </View>
      <Button title="Tilføj" className="h-12 px-4" onPress={onAdd} />
    </View>
  );
}
