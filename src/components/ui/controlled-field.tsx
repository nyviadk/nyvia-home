import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import type { KeyboardTypeOptions } from 'react-native';

import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';

/**
 * Et react-hook-form-styret tekstfelt: Controller + FormField + Input i ét.
 *
 * Blokken lå ordret ~60 gange fordelt på syv formularer, hver gang med de samme fem linjers
 * wiring omkring et enkelt felt. `home-form` havde allerede opfundet den lokalt — den er nu
 * generisk, så alle kan bruge den.
 *
 * Kun til de felter der ER en almindelig tekst-/beløbs-input. Felter med egen komponent
 * (DateField, SelectField, RecurrencePicker, Switch) beholder deres egen `<Controller>`,
 * fordi de har hver sin prop-flade.
 */
export function ControlledField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  placeholder,
  keyboardType,
  multiline,
  money,
  autoCapitalize,
  autoComplete,
  secureTextEntry,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  /** Udelades i tabel-rækker, hvor kolonnen allerede siger hvad feltet er. */
  label?: string;
  /** Fejlteksten fra `formState.errors` — kalderen slår den op, så typen forbliver præcis. */
  error?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Flerlinje-felt (note/beskrivelse) med den fælles minimumshøjde. */
  multiline?: boolean;
  /** Brug beløbs-feltet (dansk tal-formatering) frem for et almindeligt tekstfelt. */
  money?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'off' | 'email' | 'current-password';
  secureTextEntry?: boolean;
}) {
  const Field = money ? MoneyInput : Input;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => {
        const input = (
          <Field
            value={(value ?? '') as string}
            onChangeText={onChange}
            onBlur={onBlur}
            invalid={!!error}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            secureTextEntry={secureTextEntry}
            autoCorrect={autoCapitalize === 'none' ? false : undefined}
            spellCheck={autoCapitalize === 'none' ? false : undefined}
            multiline={multiline}
            className={multiline ? 'h-auto min-h-20 py-3' : undefined}
            textAlignVertical={multiline ? 'top' : undefined}
          />
        );
        return label === undefined ? (
          input
        ) : (
          <FormField label={label} error={error}>
            {input}
          </FormField>
        );
      }}
    />
  );
}
