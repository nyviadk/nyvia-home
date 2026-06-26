import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { genId } from '@/lib/id';
import { oreToKroner } from '@/lib/money';
import { Pressable, Switch, View } from '@/tw';
import { updateCustomLineItems } from '../../data/loans.repository';
import { lineItemTotalOre, principalOre } from '../calc';
import { kindOf, toSignedOre } from '../form';
import type { CustomLoan, LoanLineItem } from '../types';
import { type ItemsForm, LineItemEditRow } from './line-item-edit-row';

const absStr = (ore: number) => String(oreToKroner(Math.abs(ore)).toNumber());

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

function toggleIncluded(loan: WithId<CustomLoan>, itemId: string) {
  const next = loan.lineItems.map((item) =>
    item.id === itemId ? { ...item, included: !item.included } : item
  );
  void updateCustomLineItems(loan.id, next);
}

function ItemLine({ loan, item }: { loan: WithId<CustomLoan>; item: LoanLineItem }) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="body" className={cn('flex-1', !item.included && 'opacity-40')}>
          {item.label || '—'}
        </AppText>
        <MoneyText
          ore={Math.abs(lineItemTotalOre(item))}
          whole
          variant="body"
          className={cn(!item.included && 'opacity-40')}
        />
        <Switch value={item.included} onValueChange={() => toggleIncluded(loan, item.id)} />
      </View>
      {item.children && item.children.length > 0 ? (
        <View className="gap-0.5 pl-3">
          {item.children.map((child) => (
            <View key={child.id} className="flex-row justify-between">
              <AppText variant="muted" className={cn('flex-1', !item.included && 'opacity-40')}>
                {child.label || '—'}
              </AppText>
              <MoneyText
                ore={Math.abs(child.amount)}
                whole
                variant="muted"
                className={cn(!item.included && 'opacity-40')}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ReadView({ loan }: { loan: WithId<CustomLoan> }) {
  if (loan.lineItems.length === 0) {
    return <AppText variant="muted">Ingen poster endnu — tryk Redigér for at tilføje.</AppText>;
  }
  const expenses = loan.lineItems.filter((i) => lineItemTotalOre(i) >= 0);
  const incomes = loan.lineItems.filter((i) => lineItemTotalOre(i) < 0);

  return (
    <>
      {expenses.length > 0 ? (
        <View className="gap-2">
          <AppText variant="muted">Udgifter</AppText>
          {expenses.map((item) => (
            <ItemLine key={item.id} loan={loan} item={item} />
          ))}
        </View>
      ) : null}

      {incomes.length > 0 ? (
        <View className="mt-2 gap-2">
          <AppText variant="muted">Indtægter</AppText>
          {incomes.map((item) => (
            <ItemLine key={item.id} loan={loan} item={item} />
          ))}
        </View>
      ) : null}

      <View className="mt-1 flex-row justify-between border-t border-border pt-2">
        <AppText variant="label">Hovedstol</AppText>
        <MoneyText ore={principalOre(loan.lineItems)} whole variant="label" />
      </View>
    </>
  );
}

function EditForm({ loan, onDone }: { loan: WithId<CustomLoan>; onDone: () => void }) {
  const { control, handleSubmit, formState } = useForm<ItemsForm>({
    defaultValues: {
      items: loan.lineItems.map((i) => ({
        id: i.id,
        label: i.label,
        amount: absStr(i.amount),
        kind: kindOf(i.amount),
        children: (i.children ?? []).map((c) => ({
          id: c.id,
          label: c.label,
          amount: absStr(c.amount),
          kind: kindOf(c.amount),
        })),
      })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const save = handleSubmit(async ({ items }) => {
    const next: LoanLineItem[] = items.map((item) => {
      const children = item.children.map((c) => ({
        id: c.id || genId(),
        label: c.label.trim(),
        amount: toSignedOre(c.amount, item.kind),
      }));
      const amount = children.length
        ? children.reduce((sum, c) => sum + c.amount, 0)
        : toSignedOre(item.amount, item.kind);
      const original = loan.lineItems.find((o) => o.id === item.id);
      return {
        id: item.id || genId(),
        label: item.label.trim(),
        amount,
        included: original ? original.included : true,
        ...(children.length ? { children } : {}),
      };
    });
    await updateCustomLineItems(loan.id, next);
    onDone();
  });

  const rows = fields.map((field, index) => ({ field, index }));
  const expenseRows = rows.filter((r) => r.field.kind === 'expense');
  const incomeRows = rows.filter((r) => r.field.kind === 'income');

  return (
    <View className="gap-3">
      <View className="gap-2 rounded-xl border border-border p-3">
        <AppText variant="label">Udgifter</AppText>
        {expenseRows.map(({ field, index }) => (
          <LineItemEditRow key={field.id} control={control} index={index} onRemove={() => remove(index)} />
        ))}
        <Button
          title="Tilføj udgift"
          variant="secondary"
          onPress={() => append({ id: '', label: '', amount: '', kind: 'expense', children: [] })}
        />
      </View>

      <View className="gap-2 rounded-xl border border-border p-3">
        <AppText variant="label">Indtægter</AppText>
        {incomeRows.map(({ field, index }) => (
          <LineItemEditRow key={field.id} control={control} index={index} onRemove={() => remove(index)} />
        ))}
        <Button
          title="Tilføj indtægt"
          variant="secondary"
          onPress={() => append({ id: '', label: '', amount: '', kind: 'income', children: [] })}
        />
      </View>

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
