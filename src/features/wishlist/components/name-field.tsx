import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/**
 * Hvem er du — ren fritekst.
 *
 * Havde før en søgeliste med tidligere navne og fuzzy-match, men det fyldte mere end det
 * hjalp: skal flere med, skriver man bare "Mor & Far". Tomt felt = anonym.
 */
export function NameField({
  value,
  onChangeText,
  label = 'Hvem er du?',
  required,
}: {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  /** Sat hvor anonymitet ikke giver mening — fx når man lægger penge til en gave. */
  required?: boolean;
}) {
  return (
    <View className="gap-3">
      <AppText className="text-2xl font-bold text-fg">{label}</AppText>
      <Input
        value={value}
        onChangeText={onChangeText}
        className="h-14 text-xl"
      />
    </View>
  );
}

/** Fritekst-navnet som den lagrede liste (tom = anonym). */
export const namesFromField = (value: string): string[] =>
  value.trim() ? [value.trim()] : [];
