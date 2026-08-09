import { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { useFlushOnUnmount } from '@/hooks/use-flush-on-unmount';

/**
 * Tekstfelt der gemmer LØBENDE: skriver ved blur og flush'er ugemte ændringer hvis
 * komponenten unmountes (fx man navigerer væk). Synker kun fra kilden når VÆRDIEN ændrer
 * sig eksternt — ikke ved blur — så feltet ikke flimrer tilbage til den gamle værdi mens
 * vores egen gem-skrivning når rundt via Firestore.
 */
export function InlineTextInput({
  value,
  onSave,
  multiline,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const focusedRef = useRef(false);
  const dirty = useRef(false);
  const latest = useRef(value);
  latest.current = draft;
  const prevValue = useRef(value);

  // Justering af state UNDER render (React-dokkenes anbefaling), ikke i en effect: en effect
  // ville give et ekstra render-gennemløb hvor det gamle udkast stadig stod i feltet.
  // Skriver brugeren netop nu, rører vi ikke feltet — så et sent svar fra serveren ikke
  // overskriver det man er i gang med.
  if (value !== prevValue.current) {
    prevValue.current = value;
    if (!focusedRef.current) setDraft(value);
  }

  const flush = () => {
    if (!dirty.current) return;
    dirty.current = false;
    onSave(latest.current.trim());
  };
  // Gem ved unmount hvis der er ugemte ændringer (blur når ikke altid at fyre).
  useFlushOnUnmount(flush);

  return (
    <Input
      value={draft}
      placeholder={placeholder}
      multiline={multiline}
      onChangeText={(t) => {
        setDraft(t);
        dirty.current = true;
      }}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        flush();
      }}
      style={multiline ? { minHeight: 96, textAlignVertical: 'top' } : undefined}
      className={multiline ? 'h-auto py-3' : undefined}
    />
  );
}
