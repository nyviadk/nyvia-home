import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Text, View } from '@/tw';
import { formatAnswerText } from '../format';
import { isCipher, type EviAnswerValue, type EviField } from '../types';
import { CommandBlock } from './command-block';
import { DescriptionWithLink } from './description-with-link';
import { SensitiveField } from './sensitive-field';

function asStringArray(v: EviAnswerValue | undefined): string[] {
  return Array.isArray(v) ? v : [];
}

/** Ren, ikke-redigerbar visning af ét felt (label + pæn værdi). Følsomme felter kan stadig
 *  vises/kopieres; kommandoer beholder kopiér-knappen. */
export function AnswerView({
  field,
  value,
}: {
  field: EviField;
  value: EviAnswerValue | undefined;
}) {
  return (
    <View className="gap-1.5">
      <AppText variant="muted">{field.label || 'Uden navn'}</AppText>
      {field.description ? <DescriptionWithLink description={field.description} /> : null}
      {field.command ? <CommandBlock command={field.command} /> : null}
      <ValueView field={field} value={value} />
    </View>
  );
}

function EmptyValue() {
  return <AppText variant="muted">—</AppText>;
}

function ValueView({ field, value }: { field: EviField; value: EviAnswerValue | undefined }) {
  if (field.type === 'sensitive') {
    return <SensitiveField value={isCipher(value) ? value : undefined} onSave={() => {}} readOnly />;
  }

  if (field.type === 'checklist') {
    const vals = asStringArray(value);
    if (vals.length === 0) return <EmptyValue />;
    return (
      <View className="flex-row flex-wrap gap-1.5">
        {vals.map((v) => (
          <View
            key={v}
            className="rounded-full border border-border bg-element px-3 py-1"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-sm text-fg">{v}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (field.type === 'checkbox') {
    const checked = value === true;
    return (
      <AppText variant="body" className={cn(checked ? 'text-primary' : 'text-fg-muted')}>
        {checked ? '✓ Ja' : '—'}
      </AppText>
    );
  }

  const text = formatAnswerText(field, value);
  if (text === '') return <EmptyValue />;
  return (
    <AppText variant="body" selectable className="break-words">
      {text}
    </AppText>
  );
}
