import { useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import {
  BLUR_CLOSE_DELAY_MS,
  DropdownList,
  useDropdownKeyboard,
} from '@/components/ui/dropdown-list';
import { Input } from '@/components/ui/input';
import { View } from '@/tw';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Dropdown-select over en fast liste (samme UX som timetracker-felterne): skriv for at
 * filtrere, naviger ↑/↓, vælg Enter/klik. Ingen chips, ingen fri tekst.
 */
export function SelectField<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  invalid,
  onSelectAdvance,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (next: T) => void;
  placeholder?: string;
  invalid?: boolean;
  onSelectAdvance?: () => void;
}) {
  // query=null → ikke i redigering (vis valgt label); ellers vis/filtrér på query.
  const [query, setQuery] = useState<string | null>(null);
  const inputRef = useRef<RNTextInput>(null);

  const selected = options.find((o) => o.value === value);
  const editing = query !== null;
  const text = editing ? query : (selected?.label ?? '');
  const filtered =
    editing && query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options;
  const visible = editing && filtered.length > 0;

  const commit = (o: SelectOption<T>) => {
    onChange(o.value);
    setQuery(null);
    // Ved valg: luk feltet helt (blur) — medmindre formularen vil føre fokus videre.
    if (onSelectAdvance) onSelectAdvance();
    else inputRef.current?.blur();
  };

  const { highlight, setHighlight, onKeyPress } = useDropdownKeyboard({
    options: filtered,
    visible,
    onOpen: () => setQuery(''),
    onClose: () => setQuery(null),
    onSelect: commit,
  });

  return (
    // zIndex-toggle kun på web: på Android tegner elevation dropdownen øverst, og en
    // dynamisk zIndex-ændring re-ordner den native view → fokuseret TextInput mister fokus.
    <View className="relative" style={visible && process.env.EXPO_OS === 'web' ? { zIndex: 50 } : undefined}>
      <Input
        ref={inputRef}
        value={text}
        invalid={invalid}
        placeholder={placeholder}
        onChangeText={(t) => {
          setQuery(t);
          setHighlight(0);
        }}
        onFocus={() => {
          setQuery('');
          setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
        }}
        onBlur={() => setTimeout(() => setQuery(null), BLUR_CLOSE_DELAY_MS)}
        onKeyPress={onKeyPress}
        autoCapitalize="none"
      />

      {visible ? (
        <DropdownList
          options={filtered}
          highlight={highlight}
          onHighlight={setHighlight}
          onSelect={commit}
          labelOf={(o) => o.label}
          keyOf={(o) => String(o.value)}
          emphasize={(o) => o.value === value}
        />
      ) : null}
    </View>
  );
}
