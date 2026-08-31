import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { AppText } from '@/components/ui/text';
import { Pressable, Switch, View } from '@/tw';
import type { CvFieldSpec, FieldValue } from '../catalogue/field-spec';
import { CV_COLLECTIONS } from '../catalogue/registry';
import type { CvSnapshot } from '../data/catalogue-io';
import { ImageField } from './image-field';
import { VariantEditor } from './variant-editor';

/**
 * Ét felt, tegnet efter sin beskrivelse.
 *
 * Hele grunden til feltmodellen: der er ÉN dispatch her, ikke ni håndskrevne formularer.
 * Kommer der et felt til, står det i registret og virker med det samme.
 */
export function CatalogueField({
  spec,
  value,
  onChange,
  snapshot,
}: {
  spec: CvFieldSpec;
  value: FieldValue;
  onChange: (next: FieldValue) => void;
  snapshot: CvSnapshot;
}) {
  if (spec.kind === 'bool') {
    return (
      <View className="flex-row items-center justify-between gap-3 py-1">
        <AppText variant="label">{spec.label}</AppText>
        <Switch
          value={value.t === 'bool' ? value.v : false}
          onValueChange={(v) => onChange({ t: 'bool', v })}
        />
      </View>
    );
  }

  if (spec.kind === 'ref') {
    const def = CV_COLLECTIONS[spec.coll];
    const entries = Object.entries(snapshot[spec.coll]);
    const options = entries
      .map(([id, doc]) => ({ value: id, label: `${id} — ${def.title(doc, 'da')}` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'da'));

    return (
      <FormField label={spec.label}>
        {/*
          INGEN ekstra `relative`-beholder her. `SelectField` løfter selv sin dropdown til
          z-50 når den er åben; pakker man den ind i endnu en positioneret beholder, bliver
          det løft fanget i den ydre stacking-kontekst, og felterne under punktet maler hen
          over forslagene. Jf. [[dropdown-zindex]] — løftet bor hos den enkelte picker.
        */}
        {options.length === 0 ? (
          <AppText variant="muted" className="text-sm">
            Der er ingen {spec.label.toLowerCase()} i kataloget endnu — opret en først.
          </AppText>
        ) : (
          <SelectField
            value={value.t === 'text' ? value.v : ''}
            options={options}
            onChange={(v) => onChange({ t: 'text', v })}
            placeholder={`Skriv for at søge blandt ${options.length}`}
          />
        )}
      </FormField>
    );
  }

  if (spec.kind === 'image') {
    return (
      <FormField label={spec.label}>
        <ImageField
          value={value.t === 'text' ? value.v : ''}
          onChange={(v) => onChange({ t: 'text', v })}
        />
      </FormField>
    );
  }

  if (spec.kind === 'links') {
    const links = value.t === 'links' ? value.v : [];
    const patch = (i: number, part: Partial<{ tekst: string; url: string }>) =>
      onChange({ t: 'links', v: links.map((l, j) => (j === i ? { ...l, ...part } : l)) });

    return (
      <FormField label={spec.label}>
        <View className="gap-3">
          {links.map((link, i) => (
            <View key={i} className="gap-1.5">
              <View className="flex-row items-center gap-2">
                <Input
                  value={link.tekst}
                  onChangeText={(v) => patch(i, { tekst: v })}
                  placeholder="hgrunberg.dk"
                  autoCapitalize="none"
                  className="h-10 flex-1"
                />
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onChange({ t: 'links', v: links.filter((_, j) => j !== i) })}>
                  <AppText className="text-sm text-danger">Fjern</AppText>
                </Pressable>
              </View>
              {/* Adressen er dét man klikker på i PDF'en; teksten er dét man læser. */}
              <Input
                value={link.url}
                onChangeText={(v) => patch(i, { url: v })}
                placeholder="https://hgrunberg.dk"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-10"
              />
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => onChange({ t: 'links', v: [...links, { tekst: '', url: '' }] })}
            className="self-start">
            <AppText className="text-sm font-semibold text-primary">+ Tilføj link</AppText>
          </Pressable>
        </View>
      </FormField>
    );
  }

  if (spec.kind === 'variants') {
    return (
      <FormField label={spec.label}>
        <VariantEditor
          rows={value.t === 'variants' ? value.v : []}
          onChange={(v) => onChange({ t: 'variants', v })}
        />
      </FormField>
    );
  }

  if (spec.kind === 'strlist') {
    const list = value.t === 'list' ? value.v : [];
    return (
      <FormField label={spec.label}>
        <View className="gap-2">
          {list.map((item, i) => (
            <View key={i} className="flex-row items-center gap-2">
              <Input
                value={item}
                onChangeText={(v) =>
                  onChange({ t: 'list', v: list.map((x, j) => (j === i ? v : x)) })
                }
                autoCapitalize="none"
                className="h-10 flex-1"
              />
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onChange({ t: 'list', v: list.filter((_, j) => j !== i) })}>
                <AppText className="text-sm text-danger">Fjern</AppText>
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => onChange({ t: 'list', v: [...list, ''] })}
            className="self-start">
            <AppText className="text-sm font-semibold text-primary">+ Tilføj</AppText>
          </Pressable>
        </View>
      </FormField>
    );
  }

  if (spec.kind === 'i18n') {
    const da = value.t === 'i18n' ? value.da : '';
    const en = value.t === 'i18n' ? value.en : '';
    const long = spec.multiline;
    return (
      <FormField label={spec.label}>
        <View className="gap-2">
          <Input
            value={da}
            onChangeText={(v) => onChange({ t: 'i18n', da: v, en })}
            placeholder={spec.placeholder ?? 'Dansk'}
            multiline={long}
            autoGrow={long}
            className={long ? 'h-auto min-h-20 py-3' : undefined}
            style={long ? { textAlignVertical: 'top' } : undefined}
          />
          {/* Tom = samme på begge sprog. Den regel bor i `i18n.ts`, ikke her. */}
          <Input
            value={en}
            onChangeText={(v) => onChange({ t: 'i18n', da, en: v })}
            placeholder="Engelsk — lad stå tom hvis den er den samme"
            multiline={long}
            autoGrow={long}
            className={long ? 'h-auto min-h-20 py-3' : undefined}
            style={long ? { textAlignVertical: 'top' } : undefined}
          />
        </View>
      </FormField>
    );
  }

  return (
    <FormField label={spec.label}>
      <Input
        value={value.t === 'text' ? value.v : ''}
        onChangeText={(v) => onChange({ t: 'text', v })}
        placeholder={spec.placeholder}
        keyboardType={spec.kind === 'number' ? 'number-pad' : undefined}
        autoCapitalize={spec.kind === 'number' ? 'none' : undefined}
      />
    </FormField>
  );
}
