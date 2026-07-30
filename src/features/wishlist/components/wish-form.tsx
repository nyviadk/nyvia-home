import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { notify } from '@/lib/toast/notify';
import { cleanUrlAndGetTracking } from '@/lib/url/clean-url';
import { Pressable, Switch, View } from '@/tw';
import { fetchWishMetadata } from '../data/metadata';
import {
  toWishFormValues,
  toWishInput,
  wishFormSchema,
  type WishFormValues,
} from '../data/wish.schema';
import type { Wish, WishInput } from '../types';

function StepBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={cn('px-4 py-2', disabled ? 'opacity-30' : 'active:bg-selected')}>
      <AppText className="text-xl leading-none">{label}</AppText>
    </Pressable>
  );
}

/**
 * Opret/redigér-form. Bruger react-hook-form som resten af appen — felterne lå før i elleve
 * separate `useState`, hvilket gjorde det svært at se hvad der hørte sammen.
 */
export function WishForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Wish;
  submitLabel: string;
  onSubmit: (input: WishInput) => void | Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WishFormValues>({
    resolver: zodResolver(wishFormSchema),
    defaultValues: toWishFormValues(initial),
  });

  // Hentning er ikke formular-data, men en igangværende handling → almindelig lokal state.
  const [fetching, setFetching] = useState(false);
  const inclShipping = useWatch({ control, name: 'priceInclShipping' });
  const url = useWatch({ control, name: 'url' });

  /** Hent titel/billede/pris fra linket. Udfylder kun TOMME felter, så egne rettelser bevares. */
  const fetchFromUrl = async () => {
    const raw = getValues('url').trim();
    if (!raw || fetching) return;
    const { cleanUrl: link, removedParams } = cleanUrlAndGetTracking(raw);
    if (removedParams) setValue('url', link);
    setFetching(true);
    try {
      const meta = await fetchWishMetadata(link);
      const got: string[] = [];
      if (meta.title && !getValues('title').trim()) {
        setValue('title', meta.title, { shouldValidate: true });
        got.push('titel');
      }
      if (meta.imageUrl && !getValues('imageUrl').trim()) {
        setValue('imageUrl', meta.imageUrl);
        got.push('billede');
      }
      if (meta.price != null && !getValues('price').trim()) {
        setValue('price', String(meta.price).replace('.', ','));
        got.push('pris');
      }
      const cleaned = removedParams ? ' · tracking fjernet' : '';
      notify((got.length ? `Hentede ${got.join(', ')}` : 'Fandt intet nyt — udfyld selv') + cleaned);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Kunne ikke hente data fra linket');
    } finally {
      setFetching(false);
    }
  };

  const submit = handleSubmit(async (values) => {
    await onSubmit(toWishInput(values));
  });

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Titel" error={errors.title?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Hvad ønsker du dig?"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="url"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Link (valgfri)">
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="https://butik.dk/…"
                  autoCapitalize="none"
                />
              </View>
              <Button
                title={fetching ? 'Henter…' : 'Hent'}
                variant="secondary"
                className="h-12 px-4"
                disabled={!url.trim() || fetching}
                loading={fetching}
                onPress={fetchFromUrl}
              />
            </View>
            <AppText variant="muted" className="mt-1 text-xs">
              Henter titel, billede og pris fra linket. Kun tomme felter udfyldes.
            </AppText>
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="imageUrl"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Billede-URL (valgfri)">
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="https://…/billede.jpg"
              autoCapitalize="none"
            />
          </FormField>
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Pris (kr.)">
                <MoneyInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="0" />
              </FormField>
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="shipping"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Fragt (kr.)">
                <MoneyInput
                  value={inclShipping ? '' : value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!inclShipping}
                  placeholder={inclShipping ? 'inkl.' : 'valgfri'}
                />
              </FormField>
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="priceInclShipping"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center justify-between">
            <AppText>Pris er inkl. fragt</AppText>
            <Switch value={value} onValueChange={onChange} />
          </View>
        )}
      />

      <Controller
        control={control}
        name="quantity"
        render={({ field: { onChange, value } }) => (
          <FormField label="Antal ønsket">
            <View
              className="flex-row items-center self-start overflow-hidden rounded-xl border border-border bg-card"
              style={{ borderCurve: 'continuous' }}>
              <StepBtn label="−" onPress={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} />
              <View className="items-center border-x border-border py-2" style={{ minWidth: 48 }}>
                <AppText className="text-base font-semibold">{value}</AppText>
              </View>
              <StepBtn
                label="+"
                onPress={() => onChange(Math.min(99, value + 1))}
                disabled={value >= 99}
              />
            </View>
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Beskrivelse (valgfri)">
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Fx farve, størrelse…"
              multiline
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="favorite"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center justify-between">
            <AppText>⭐ Favorit (vises øverst)</AppText>
            <Switch value={value} onValueChange={onChange} />
          </View>
        )}
      />

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} className="mt-2" />
    </View>
  );
}
