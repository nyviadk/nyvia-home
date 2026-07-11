import { Fragment, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { genId } from '@/lib/id';
import { notify } from '@/lib/toast/notify';
import { Pressable, Text, View } from '@/tw';
import { saveEviTemplate } from '../data/evi-template.repository';
import { mergeSeed } from '../data/notion-template-seed';
import type { EviField } from '../types';
import { FieldEditor } from './field-editor';

/**
 * Skabelon-editor. Ejer felt-listen lokalt mens den er monteret og gemmer LØBENDE
 * (debounced + flush ved unmount). Ændringer her slår igennem på alle kunder, fordi de
 * kun refererer felter via stabile id'er.
 */
export function TemplateEditor({ initialFields }: { initialFields: EviField[] }) {
  const [fields, setFields] = useState<EviField[]>(initialFields);
  const pending = useRef(fields);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    void saveEviTemplate(pending.current);
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => () => flushRef.current(), []);

  const apply = (next: EviField[]) => {
    pending.current = next;
    setFields(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flushRef.current(), 500);
  };

  const updateField = (id: string, next: EviField) =>
    apply(fields.map((f) => (f.id === id ? next : f)));
  const removeField = (id: string) => apply(fields.filter((f) => f.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = fields.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= fields.length) return;
    const next = fields.slice();
    [next[i], next[j]] = [next[j], next[i]];
    apply(next);
  };
  const addField = () => apply([...fields, { id: genId(), label: '', type: 'text' }]);
  const insertAt = (index: number) =>
    apply([...fields.slice(0, index), { id: genId(), label: '', type: 'text' }, ...fields.slice(index)]);
  const importNotion = () => {
    const { fields: next, added, updated } = mergeSeed(fields);
    if (added === 0 && updated === 0) {
      notify('Alt fra Notion er allerede opdateret');
      return;
    }
    apply(next);
    notify(`Notion: ${added} tilføjet, ${updated} opdateret`);
  };

  const sections = Array.from(
    new Set(fields.map((f) => f.section).filter((s): s is string => !!s)),
  );
  const reuseKeys = Array.from(
    new Set(fields.map((f) => f.reuseKey).filter((k): k is string => !!k)),
  );

  return (
    <View className="gap-3">
      {/* Faldende zIndex pr. kort (+ relative) → en åben type-dropdown i ét kort lægger
          sig over kortene nedenunder i stedet for at gemme sig bag dem. Statisk zIndex er
          sikkert på Android (kun DYNAMISK toggle skal web-guardes, jf. SelectField). */}
      {fields.map((f, i) => (
        <Fragment key={f.id}>
          <View className="relative" style={{ zIndex: fields.length - i }}>
            <FieldEditor
              field={f}
              onChange={(next) => updateField(f.id, next)}
              onRemove={() => removeField(f.id)}
              onMoveUp={() => move(f.id, -1)}
              onMoveDown={() => move(f.id, 1)}
              isFirst={i === 0}
              isLast={i === fields.length - 1}
              sections={sections}
              reuseKeys={reuseKeys}
            />
          </View>
          {i < fields.length - 1 ? <InsertHere onPress={() => insertAt(i + 1)} /> : null}
        </Fragment>
      ))}
      {fields.length === 0 ? (
        <AppText variant="muted">
          Ingen felter endnu. Tilføj det første felt for at bygge formularen.
        </AppText>
      ) : null}
      <Button title="+ Tilføj felt" variant="secondary" onPress={addField} />
      <Button title="Importér fra Notion-formular" variant="ghost" onPress={importNotion} />
    </View>
  );
}

/** Diskret "indsæt felt her"-knap mellem to felter. */
function InsertHere({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="items-center py-0.5">
      <View
        className="rounded-full border border-dashed border-border px-3 py-1 hover:border-primary"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-xs text-fg-muted">+ Indsæt felt her</Text>
      </View>
    </Pressable>
  );
}
