import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { todayISODate } from '@/lib/datetime';
import { View } from '@/tw';
import { setOfficialStartDate } from '../data/timetracker-settings.repository';
import { useTimetrackerSettingsStore } from '../data/timetracker-settings-store';

const schema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Brug formatet ÅÅÅÅ-MM-DD'),
});
type Values = z.infer<typeof schema>;

export function TimetrackerSettingsScreen() {
  const officialStart = useTimetrackerSettingsStore((s) => s.officialStartDate);
  const loading = useTimetrackerSettingsStore((s) => s.loading);

  if (loading) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Officiel projektstart</AppText>
      <AppText variant="muted">
        Skille-punktet i oversigten. Når den er sat, kan du slå "Vis kun efter officiel
        projektstart" til på timetracker-forsiden.
      </AppText>
      <OfficialStartForm
        startDate={officialStart ?? todayISODate()}
        onSubmit={async (date) => {
          await setOfficialStartDate(date);
          router.back();
        }}
      />
    </Screen>
  );
}

function OfficialStartForm({
  startDate,
  onSubmit,
}: {
  startDate: string;
  onSubmit: (startDate: string) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { startDate } });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values.startDate);
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="startDate"
        render={({ field: { onChange, value } }) => (
          <FormField label="Dato" error={errors.startDate?.message}>
            <DateField value={value} onChange={onChange} invalid={!!errors.startDate} />
          </FormField>
        )}
      />
      <Button title="Gem" onPress={submit} loading={isSubmitting} />
    </View>
  );
}
