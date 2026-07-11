import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Input } from '@/components/ui/input';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Pressable, Switch, Text, View } from '@/tw';
import type { EviField, EviFieldType } from '../types';
import { ChecklistInput } from './checklist-input';
import { OptionsEditor } from './options-editor';

const TYPE_OPTIONS: SelectOption<EviFieldType>[] = [
  { value: 'text', label: 'Tekst' },
  { value: 'longtext', label: 'Lang tekst' },
  { value: 'date', label: 'Dato' },
  { value: 'checkbox', label: 'Afkrydsning (ja/nej)' },
  { value: 'checklist', label: 'Tjekliste (flere valg)' },
  { value: 'choice', label: 'Valg (ét)' },
  { value: 'sensitive', label: 'Følsom (krypteret, kun web)' },
];

function TinyButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={cn('rounded-md px-2 py-1', disabled ? 'opacity-30' : 'hover:bg-element')}>
      <Text className="text-sm text-fg-muted">{label}</Text>
    </Pressable>
  );
}

/** Redigér ét skabelon-felt. Ændringer bobler op via onChange (skærmen gemmer løbende). */
export function FieldEditor({
  field,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  sections,
  reuseKeys,
}: {
  field: EviField;
  onChange: (next: EviField) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  sections: string[];
  reuseKeys: string[];
}) {
  const patch = (p: Partial<EviField>) => onChange({ ...field, ...p });

  const desc = field.description;
  const hasLink = desc?.href !== undefined;
  const setDesc = (text: string, href: string | undefined) => {
    const hasHref = href !== undefined;
    if (text.trim() === '' && !hasHref) {
      patch({ description: undefined });
      return;
    }
    // Aldrig `{ text, href: undefined }` — Firestore afviser undefined-værdier.
    patch({ description: hasHref ? { text, href } : { text } });
  };

  const showsOptions = field.type === 'checklist' || field.type === 'choice';
  const otherKeys = reuseKeys.filter((k) => k && k !== field.reuseKey);

  return (
    <View
      className="gap-3 rounded-2xl border border-border bg-card p-4"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-center gap-2">
        <Input
          value={field.label}
          onChangeText={(v) => patch({ label: v })}
          placeholder="Felt-navn (fx Kundens e-mail)"
          className="flex-1"
        />
        <TinyButton label="↑" onPress={onMoveUp} disabled={isFirst} />
        <TinyButton label="↓" onPress={onMoveDown} disabled={isLast} />
        <TinyButton label="✕" onPress={onRemove} />
      </View>

      {/* Løft type-gruppen så SelectField-dropdown'en lægger sig OVER felterne nedenunder
          i kortet (zIndex virker kun blandt søskende → senere blokke tegnes ellers ovenpå). */}
      <View className="gap-1.5" style={{ zIndex: 20 }}>
        <AppText variant="muted">Type</AppText>
        <SelectField<EviFieldType>
          value={field.type}
          options={TYPE_OPTIONS}
          onChange={(t) => patch({ type: t })}
        />
      </View>

      <View className="gap-1.5">
        <AppText variant="muted">Beskrivelse (valgfri)</AppText>
        <View className="flex-row items-center gap-2">
          <Input
            value={desc?.text ?? ''}
            onChangeText={(v) => setDesc(v, desc?.href)}
            placeholder="Hjælpetekst under feltet"
            className="flex-1"
          />
          <TinyButton
            label={hasLink ? '− Link' : '+ Link'}
            onPress={() =>
              hasLink ? setDesc(desc?.text ?? '', undefined) : setDesc(desc?.text ?? '', '')
            }
          />
        </View>
        {hasLink ? (
          <Input
            value={desc?.href ?? ''}
            onChangeText={(v) => setDesc(desc?.text ?? '', v)}
            placeholder="https://…"
            autoCapitalize="none"
          />
        ) : null}
      </View>

      <View className="gap-1.5">
        <AppText variant="muted">Kommando / URL (valgfri — får kopiér-knap)</AppText>
        <Input
          value={field.command ?? ''}
          onChangeText={(v) => patch({ command: v.trim() === '' ? undefined : v })}
          placeholder="fx npm run evi:sync-slices --target=repo"
          autoCapitalize="none"
        />
      </View>

      {showsOptions ? (
        <OptionsEditor options={field.options ?? []} onChange={(o) => patch({ options: o })} />
      ) : null}

      <View className="gap-1.5">
        <AppText variant="muted">Sektion (valgfri gruppering)</AppText>
        <AutocompleteInput
          value={field.section ?? ''}
          suggestions={sections}
          onChange={(v) => patch({ section: v.trim() === '' ? undefined : v })}
          placeholder="fx Opsætning, Status"
        />
      </View>

      <View className="gap-1.5">
        <AppText variant="muted">Genbrugs-nøgle (så værdien kan kopieres frem)</AppText>
        <Input
          value={field.reuseKey ?? ''}
          onChangeText={(v) => patch({ reuseKey: v.trim() === '' ? undefined : v.trim() })}
          placeholder="fx mail, repo"
          autoCapitalize="none"
        />
      </View>

      {otherKeys.length > 0 ? (
        <View className="gap-1.5">
          <AppText variant="muted">Vis kopiér-genveje her</AppText>
          <ChecklistInput
            options={otherKeys}
            value={field.showReuse ?? []}
            onChange={(v) => patch({ showReuse: v.length ? v : undefined })}
          />
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <AppText variant="muted">Vis i toppen (nøgle-info)</AppText>
        <Switch value={!!field.pinned} onValueChange={(v) => patch({ pinned: v })} />
      </View>
    </View>
  );
}
