import { useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import {
  BLUR_CLOSE_DELAY_MS,
  DropdownList,
  useDropdownKeyboard,
} from '@/components/ui/dropdown-list';
import { Input } from '@/components/ui/input';
import { View } from '@/tw';
import { categorySuggestions } from '../data/categories';
import { useTimetrackerStore } from '../data/timetracker-store';

/**
 * Funktion/kategori-felt som dropdown-select: fri tekst (feltet ér værdien) + søge-agtige
 * forslag. Naviger med ↑/↓, vælg med Enter/klik — ved valg hopper fokus videre via
 * `onSelectAdvance`. Ingen chips.
 */
export function CategoryPicker({
  value,
  onChange,
  inputRef,
  onSelectAdvance,
}: {
  value: string;
  onChange: (next: string) => void;
  inputRef?: React.Ref<RNTextInput>;
  onSelectAdvance?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const entries = useTimetrackerStore.useVisibleItems();
  const suggestions = categorySuggestions(entries, value);
  const visible = open && suggestions.length > 0;

  function commit(s: string) {
    onChange(s);
    setOpen(false);
    onSelectAdvance?.();
  }

  const { highlight, setHighlight, onKeyPress } = useDropdownKeyboard({
    options: suggestions,
    visible,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onSelect: commit,
  });

  return (
    // Dynamisk zIndex kun på web: på Android re-ordner det viewet og TextInput mister fokus.
    <View
      className="relative"
      style={visible && process.env.EXPO_OS === 'web' ? { zIndex: 50 } : undefined}>
      <Input
        ref={inputRef}
        value={value}
        onChangeText={(t) => {
          onChange(t);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), BLUR_CLOSE_DELAY_MS)}
        onKeyPress={onKeyPress}
        placeholder="Funktion (fx Udvikling)"
      />

      {visible ? (
        <DropdownList
          options={suggestions}
          highlight={highlight}
          onHighlight={setHighlight}
          onSelect={commit}
          labelOf={(s) => s}
          keyOf={(s) => s}
        />
      ) : null}
    </View>
  );
}
