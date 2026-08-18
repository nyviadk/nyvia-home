import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { FormField } from '@/components/ui/form-field';
import { PhotoStrip } from '@/components/ui/photo-strip';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { pickImages } from '@/lib/capture/pick-images';
import { View } from '@/tw';
import type { EditableImage } from '../data/spanish.repository';
import {
  spanishFormSchema,
  toSpanishFormValues,
  toSpanishInput,
  type SpanishFormValues,
} from '../data/spanish.schema';
import {
  SPANISH_KINDS,
  isSpanishText,
  sideLabels,
  type SpanishEntry,
  type SpanishEntryInput,
  type SpanishKind,
} from '../types';
import { SpeakableText } from './speakable-text';
import { SpeakButton } from './speak-button';

const imageUrl = (img: EditableImage) => ('url' in img ? img.url : img.uri);

/**
 * Valget mellem de tre typer handler ikke om grammatik, men om hvordan du vil testes — og
 * det er ikke til at gætte ud fra etiketterne alene. Derfor står konsekvensen skrevet under
 * knapperne, i stedet for at man skal starte en runde for at opdage forskellen.
 */
const KIND_HINT: Record<SpanishKind, string> = {
  ord: 'Ét ord med ét facit. Du skriver svaret og får rigtigt/forkert.',
  saetning: 'En hel vending med ét facit. Du skriver svaret og får rigtigt/forkert.',
  regel:
    'Noget uden ét svar man kan taste. Du får overskriften, svarer i hovedet og trykker "Vis forklaring". Tæller ikke i resultatet.',
};

export function EntryForm({
  entry,
  submitLabel,
  onSubmit,
}: {
  entry?: SpanishEntry;
  submitLabel: string;
  onSubmit: (
    input: SpanishEntryInput,
    images: EditableImage[],
    onProgress: (done: number, total: number) => void
  ) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SpanishFormValues>({
    resolver: zodResolver(spanishFormSchema),
    defaultValues: toSpanishFormValues(entry),
  });

  // Billeder styres uden for react-hook-form: de er filer, ikke felter, og skal uploades.
  const [images, setImages] = useState<EditableImage[]>(entry?.images ?? []);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const kind = useWatch({ control, name: 'kind' }) as SpanishKind;
  const labels = sideLabels(kind);
  const spanish = useWatch({ control, name: 'es' }) ?? '';
  const speakable = isSpanishText(kind);

  const add = async () => {
    const picked = await pickImages();
    if (picked.length) setImages((prev) => [...prev, ...picked.map((p) => ({ uri: p.uri }))]);
  };

  const submit = handleSubmit(async (values) => {
    setProgress(null);
    await onSubmit(toSpanishInput(values), images, (done, total) => setProgress({ done, total }));
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="kind"
        render={({ field: { onChange, value } }) => (
          <FormField label="Type">
            <View className="gap-2">
              <Segmented<SpanishKind> value={value} options={SPANISH_KINDS} onChange={onChange} />
              <AppText variant="muted" className="text-xs">
                {KIND_HINT[value]}
              </AppText>
            </View>
          </FormField>
        )}
      />

      <ControlledField
        control={control}
        name="da"
        label={labels.da}
        error={errors.da?.message}
        multiline={kind === 'saetning'}
        placeholder={
          kind === 'ord' ? 'fx morgen' : kind === 'regel' ? 'fx ser vs. estar' : 'Skriv her…'
        }
      />

      <View className="gap-1.5">
        <ControlledField
          control={control}
          name="es"
          label={labels.es}
          error={errors.es?.message}
          multiline={kind !== 'ord'}
          placeholder={
            kind === 'ord'
              ? 'fx la mañana'
              : kind === 'regel'
                ? 'ser = permanent · estar = midlertidig'
                : 'Skriv her…'
          }
        />
        {/* Man kan ikke trykke på ord inde i et tekstfelt, så teksten gentages her som
            trykbar forhåndsvisning — nyttigt til at tjekke udtalen af ét ord mens man skriver.
            En regel-forklaring er dansk og får derfor ingen "hør hele", kun ord-tryk. */}
        {spanish.trim() ? (
          <View className="gap-1.5 rounded-xl bg-element p-3">
            <SpeakableText text={spanish} />
            <View className="flex-row items-center gap-2">
              {speakable ? <SpeakButton text={spanish} label="🔊 Hør hele" /> : null}
              <AppText variant="muted" className="text-xs">
                {speakable ? 'eller tryk på et enkelt ord' : 'Tryk på et spansk ord for at høre det'}
              </AppText>
            </View>
          </View>
        ) : null}
      </View>

      {/* Udtalen giver kun mening for spansk tekst — en regels forklaring er dansk. */}
      {speakable ? (
        <ControlledField
          control={control}
          name="pron"
          label="Udtale (valgfri)"
          placeholder="fx bwe-nos di-as"
        />
      ) : null}

      <ControlledField
        control={control}
        name="note"
        label="Note (valgfri)"
        multiline
        placeholder="Fx huskeregel, kontekst, undtagelser…"
      />

      <View className="gap-2">
        <AppText variant="label">Billeder (valgfri)</AppText>
        <AppText variant="muted">Tryk på et billede for at fjerne det igen.</AppText>
        <PhotoStrip
          urls={images.map(imageUrl)}
          onRemove={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))}
        />
        <Button title="Tilføj billeder" variant="secondary" onPress={add} />
      </View>

      {progress ? (
        <AppText variant="muted">
          Uploader… {progress.done} / {progress.total}
        </AppText>
      ) : null}

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
