import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

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

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;
    if (!focusedRef.current) setDraft(value);
  }, [value]);

  const flush = () => {
    if (!dirty.current) return;
    dirty.current = false;
    onSave(latest.current.trim());
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;
  // Gem ved unmount hvis der er ugemte ændringer (blur når ikke altid at fyre).
  useEffect(() => () => flushRef.current(), []);

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
