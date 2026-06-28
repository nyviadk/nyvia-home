import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { TextInput as RNTextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { type TimeFormValues, timeFormSchema, toTimeFormValues, toTimeInput } from '../data/time.schema';
import { durationFromTimes, formatDuration, isOvernight } from '../time.utils';
import type { TimeEntry, TimeEntryInput } from '../types';
import { CategoryPicker } from './category-picker';
import { TimeInput } from './time-input';

export interface TimeEntryFormProps {
  entry?: TimeEntry;
  submitLabel: string;
  onSubmit: (input: TimeEntryInput) => Promise<void>;
}

export function TimeEntryForm({ entry, submitLabel, onSubmit }: TimeEntryFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TimeFormValues>({
    resolver: zodResolver(timeFormSchema),
    defaultValues: toTimeFormValues(entry),
  });

  const startTime = useWatch({ control, name: 'startTime' }) ?? '';
  const endTime = useWatch({ control, name: 'endTime' }) ?? '';
  const duration = durationFromTimes(startTime, endTime);
  const overnight = isOvernight(startTime, endTime);

  // Fokus-styring: vælg start → slut → funktion → beskrivelse.
  const endRef = useRef<RNTextInput>(null);
  const categoryRef = useRef<RNTextInput>(null);
  const descriptionRef = useRef<RNTextInput>(null);

  const submit = handleSubmit(async (values) => {
    await onSubmit(toTimeInput(values));
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Dato (ÅÅÅÅ-MM-DD)" error={errors.date?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="2026-06-27"
              autoCapitalize="none"
            />
          </FormField>
        )}
      />

      {/* zIndex løfter hele tids-rækken over de efterfølgende felter, så dropdown'en
          (absolut placeret) ikke gemmer sig bag varigheds-kortet m.m. */}
      <View className="flex-row gap-3" style={{ zIndex: 10 }}>
        <View className="flex-1">
          <Controller
            control={control}
            name="startTime"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Start (HH:mm)" error={errors.startTime?.message}>
                <TimeInput
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="0900"
                  onSelectAdvance={() => endRef.current?.focus()}
                />
              </FormField>
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="endTime"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Slut (HH:mm)" error={errors.endTime?.message}>
                <TimeInput
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="1700"
                  inputRef={endRef}
                  onSelectAdvance={() => categoryRef.current?.focus()}
                />
              </FormField>
            )}
          />
        </View>
      </View>

      <Card className="flex-row items-baseline justify-between bg-element">
        <AppText variant="label">Varighed</AppText>
        <AppText variant="label">{duration > 0 ? formatDuration(duration) : '—'}</AppText>
      </Card>
      {overnight ? (
        <AppText variant="muted">Natarbejde: slutter næste dag (registreres som én post).</AppText>
      ) : null}

      {/* zIndex så funktions-dropdown'en lægger sig over beskrivelses-feltet nedenunder. */}
      <View style={{ zIndex: 5 }}>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <FormField label="Funktion" error={errors.category?.message}>
              <CategoryPicker
                value={value}
                onChange={onChange}
                inputRef={categoryRef}
                onSelectAdvance={() => descriptionRef.current?.focus()}
              />
            </FormField>
          )}
        />
      </View>

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Beskrivelse (valgfri)">
            <Input
              ref={descriptionRef}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Fx hvad du arbejdede på"
              multiline
              className="h-auto min-h-20 py-3"
              textAlignVertical="top"
            />
          </FormField>
        )}
      />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </View>
  );
}
