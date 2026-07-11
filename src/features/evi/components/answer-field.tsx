import { DateField } from '@/components/ui/date-field';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from '@/tw';
import type { ReuseValue } from '../reuse';
import { isCipher, type EviAnswerValue, type EviField } from '../types';
import { ChecklistInput } from './checklist-input';
import { ChoiceInput } from './choice-input';
import { CommandBlock } from './command-block';
import { DescriptionWithLink } from './description-with-link';
import { InlineTextInput } from './inline-text-input';
import { ReuseChip } from './reuse-chip';
import { SensitiveField } from './sensitive-field';

function asString(v: EviAnswerValue | undefined): string {
  return typeof v === 'string' ? v : '';
}
function asStringArray(v: EviAnswerValue | undefined): string[] {
  return Array.isArray(v) ? v : [];
}

/** Ét felt i submission-visningen: etiket + beskrivelse + kopier-frem-chips + inline-input. */
export function AnswerField({
  field,
  value,
  onSave,
  reuseValues,
}: {
  field: EviField;
  value: EviAnswerValue | undefined;
  onSave: (value: EviAnswerValue) => void;
  reuseValues: Map<string, ReuseValue>;
}) {
  const chips = (field.showReuse ?? [])
    .map((k) => reuseValues.get(k))
    .filter((r): r is ReuseValue => !!r);

  return (
    <View className="gap-2">
      <AppText variant="label">{field.label || 'Uden navn'}</AppText>
      {field.description ? <DescriptionWithLink description={field.description} /> : null}
      {field.command ? <CommandBlock command={field.command} /> : null}
      {/* Kopiér-frem-chips til HØJRE for inputtet (ikke over) — så det er tydeligt at man
          kopierer en tidligere værdi og indsætter i feltet ved siden af. */}
      <View className="flex-row items-start gap-2">
        <View className="flex-1" style={{ minWidth: 0 }}>
          <Control field={field} value={value} onSave={onSave} />
        </View>
        {chips.length > 0 ? (
          <View className="gap-1" style={{ flexShrink: 0 }}>
            {chips.map((r) => (
              <ReuseChip key={r.key} reuse={r} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Control({
  field,
  value,
  onSave,
}: {
  field: EviField;
  value: EviAnswerValue | undefined;
  onSave: (value: EviAnswerValue) => void;
}) {
  switch (field.type) {
    case 'longtext':
      return (
        <InlineTextInput value={asString(value)} onSave={onSave} multiline placeholder="Dit svar" />
      );
    case 'date':
      return <DateField value={asString(value)} onChange={onSave} />;
    case 'checkbox':
      return <CheckboxControl checked={value === true} onToggle={() => onSave(!(value === true))} />;
    case 'checklist':
      return (
        <ChecklistInput options={field.options ?? []} value={asStringArray(value)} onChange={onSave} />
      );
    case 'choice':
      return <ChoiceInput options={field.options ?? []} value={asString(value)} onChange={onSave} />;
    case 'sensitive':
      return <SensitiveField value={isCipher(value) ? value : undefined} onSave={onSave} />;
    default:
      return <InlineTextInput value={asString(value)} onSave={onSave} placeholder="Dit svar" />;
  }
}

function CheckboxControl({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={{ borderCurve: 'continuous' }}
      className={cn(
        'flex-row items-center gap-2 self-start rounded-full border px-3 py-2',
        checked ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-element',
      )}>
      <View
        className={cn(
          'h-4 w-4 items-center justify-center rounded border',
          checked ? 'border-primary bg-primary' : 'border-border',
        )}>
        {checked ? <Text className="text-xs text-on-primary">✓</Text> : null}
      </View>
      <Text className={cn('text-sm', checked ? 'text-fg' : 'text-fg-muted')}>Ja</Text>
    </Pressable>
  );
}
