import { useState } from 'react';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';

/**
 * Den absolut placerede forslags-liste under et tekstfelt, og tastaturnavigationen til den.
 *
 * Fire komponenter (SelectField, AutocompleteInput og de to CategoryPicker) havde hver sin
 * kopi af nøjagtig samme flade og samme ↑/↓/Enter/Escape-handler.
 *
 * ⚠️ Z-INDEX: her ligger KUN dropdown'ens egen `z-50`. Løftet af den OMGIVENDE gruppe hører
 * til hos kalderen, fordi det afhænger af hvad der står under den i netop dét layout —
 * se [[dropdown-zindex]]. Rør ikke ved det herfra.
 */

/** Kalderen ejer sin egen tilstand; hooken laver kun tastatur-logikken. */
export function useDropdownKeyboard<T>({
  options,
  visible,
  onOpen,
  onClose,
  onSelect,
}: {
  options: readonly T[];
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (option: T) => void;
}) {
  const [highlight, setHighlight] = useState(0);

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = e.nativeEvent.key;
    if (key === 'ArrowDown') {
      e.preventDefault?.();
      if (!visible) {
        onOpen();
        setHighlight(0);
      } else {
        setHighlight((h) => Math.min(h + 1, options.length - 1));
      }
    } else if (key === 'ArrowUp') {
      e.preventDefault?.();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (key === 'Enter') {
      if (visible && options.length > 0) {
        e.preventDefault?.();
        const picked = options[highlight] ?? options[0];
        if (picked !== undefined) onSelect(picked);
      }
    } else if (key === 'Escape') {
      onClose();
    }
  };

  return { highlight, setHighlight, onKeyPress };
}

/** Selve fladen. Render den kun når den skal være synlig. */
export function DropdownList<T>({
  options,
  highlight,
  onHighlight,
  onSelect,
  labelOf,
  keyOf,
  emphasize,
}: {
  options: readonly T[];
  highlight: number;
  onHighlight: (index: number) => void;
  onSelect: (option: T) => void;
  labelOf: (option: T) => string;
  keyOf: (option: T) => string;
  /** Fremhæv en linje i primær-farve — bruges til "+ Opret …". */
  emphasize?: (option: T) => boolean;
}) {
  return (
    <View
      className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-xl border border-border bg-card"
      style={{
        boxShadow: '0 6px 16px rgba(40, 40, 38, 0.12)',
        borderCurve: 'continuous',
        elevation: 8,
      }}>
      {options.map((option, i) => (
        <Pressable
          key={keyOf(option)}
          accessibilityRole="button"
          onPress={() => onSelect(option)}
          onHoverIn={() => onHighlight(i)}
          className={cn('px-4 py-2.5', i === highlight && 'bg-element')}>
          <Text className={cn('text-base', emphasize?.(option) ? 'text-primary' : 'text-fg')}>
            {labelOf(option)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Blur lukker først efter en kort forsinkelse: et klik på et forslag udløser blur FØR
 * onPress, så uden ventetiden nåede listen at forsvinde inden valget registrerede.
 */
export const BLUR_CLOSE_DELAY_MS = 120;
