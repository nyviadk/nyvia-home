import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { genId } from '@/lib/id';
import { oreToKroner, parseKronerInput } from '@/lib/money';
import { Pressable, Switch, View } from '@/tw';
import { updateCustomLineItems } from '../../data/loans.repository';
import { principalOre } from '../calc';
import type { CustomLoan } from '../types';

const parse = (s: string) => parseKronerInput(s) ?? 0;
type ItemForm = { items: { id: string; label: string; amount: string }[] };

export function EditableLineItems({ loan }: { loan: WithId<CustomLoan> }) {
  const [editing, setEditing] = useState(false);
  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between">
        <AppText variant="heading">Poster</AppText>
        {!editing ? (
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)}>
            <AppText className="text-primary">Redigér</AppText>
          </Pressable>
        ) : null}
      </View>
      {editing ? (
        <EditForm loan={loan} onDone={() => setEditing(false)} />
      ) : (
        <ReadView loan={loan} />
      )}
    </Card>
  );
}

function toggle(loan: WithId<CustomLoan>, itemId: string) {
  const next = loan.lineItems.map((i) => (i.id === itemId ? { ...i, included: !i.included } : i));
  void updateCustomLineItems(loan.id, next);
}

function ReadView({ loan }: { loan: WithId<CustomLoan> }) {
  if (loan.lineItems.length === 0) {
    return <AppText variant="muted">Ingen poster endnu — tryk Redigér for at tilføje.</AppText>;
  }
  return (
    <>
      {loan.lineItems.map((item) => (
        <View key={item.id} className="flex-row items-center justify-between gap-3">
          <AppText variant="body" className={cn('flex-1', !item.included && 'opacity-40')}>
            {item.label || '—'}
          </AppText>
          <MoneyText
            ore={item.amount}
            whole
            variant="muted"
            className={cn(!item.included && 'opacity-40')}
          />
          <Switch value={item.included} onValueChange={() => toggle(loan, item.id)} />
        </View>
      ))}
      <View className="mt-1 flex-row justify-between border-t border-selected pt-2">
        <AppText variant="label">Hovedstol</AppText>
        <MoneyText ore={principalOre(loan.lineItems)} whole variant="label" />
      </View>
    </>
  );
}

function EditForm({ loan, onDone }: { loan: WithId<CustomLoan>; onDone: () => void }) {
  const { control, handleSubmit, formState } = useForm<ItemForm>({
    defaultValues: {
      items: loan.lineItems.map((i) => ({
        id: i.id,
        label: i.label,
        amount: String(oreToKroner(i.amount).toNumber()),
      })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const save = handleSubmit(async ({ items }) => {
    const next = items.map((it) => {
      const orig = loan.lineItems.find((o) => o.id === it.id);
      return {
        id: it.id || genId(),
        label: it.label.trim(),
        amount: parse(it.amount),
        included: orig ? orig.included : true,
      };
    });
    await updateCustomLineItems(loan.id, next);
    onDone();
  });

  return (
    <View className="gap-3">
      {fields.map((field, index) => (
        <View key={field.id} className="flex-row items-center gap-2">
          <View className="flex-1">
            <Controller
              control={control}
              name={`items.${index}.label`}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Beskrivelse" />
              )}
            />
          </View>
          <View className="w-24">
            <Controller
              control={control}
              name={`items.${index}.amount`}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="kr." />
              )}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={() => remove(index)}>
            <AppText className="text-red-500">✕</AppText>
          </Pressable>
        </View>
      ))}
      <Button title="Tilføj post" variant="secondary" onPress={() => append({ id: '', label: '', amount: '' })} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button title="Annullér" variant="ghost" onPress={onDone} />
        </View>
        <View className="flex-1">
          <Button title="Gem" onPress={save} loading={formState.isSubmitting} />
        </View>
      </View>
    </View>
  );
}
