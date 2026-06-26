import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { genId } from '@/lib/id';
import { oreToKroner, parseKronerInput } from '@/lib/money';
import { Pressable, View } from '@/tw';
import { updateCustomExpenseTable } from '../../data/loans.repository';
import { expenseTotalOre } from '../calc';
import type { CustomLoan, ExpenseTable } from '../types';

const parse = (s: string) => parseKronerInput(s) ?? 0;
type TableKey = 'newHome' | 'oldHome';
type TableForm = { title: string; rows: { label: string; amount: string; note: string }[] };

export interface EditableExpenseTableProps {
  loan: WithId<CustomLoan>;
  tableKey: TableKey;
  defaultTitle: string;
}

export function EditableExpenseTable({ loan, tableKey, defaultTitle }: EditableExpenseTableProps) {
  const [editing, setEditing] = useState(false);
  const table = loan[tableKey];

  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between">
        <AppText variant="heading">{table.title || defaultTitle}</AppText>
        {!editing ? (
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)}>
            <AppText className="text-primary">Redigér</AppText>
          </Pressable>
        ) : null}
      </View>
      {editing ? (
        <EditForm
          loan={loan}
          tableKey={tableKey}
          defaultTitle={defaultTitle}
          onDone={() => setEditing(false)}
        />
      ) : (
        <ReadView table={table} />
      )}
    </Card>
  );
}

function ReadView({ table }: { table: ExpenseTable }) {
  return (
    <>
      {table.rows.length === 0 ? (
        <AppText variant="muted">Ingen poster.</AppText>
      ) : (
        table.rows.map((row) => (
          <View key={row.id} className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <AppText variant="body">{row.label}</AppText>
              {row.note ? <AppText variant="muted">{row.note}</AppText> : null}
            </View>
            <MoneyText ore={row.amount} whole variant="body" />
          </View>
        ))
      )}
      <View className="mt-1 flex-row justify-between border-t border-border pt-2">
        <AppText variant="label">I alt</AppText>
        <MoneyText ore={expenseTotalOre(table)} whole variant="label" />
      </View>
    </>
  );
}

function EditForm({
  loan,
  tableKey,
  defaultTitle,
  onDone,
}: EditableExpenseTableProps & { onDone: () => void }) {
  const table = loan[tableKey];
  const { control, handleSubmit, formState } = useForm<TableForm>({
    defaultValues: {
      title: table.title,
      rows: table.rows.map((r) => ({
        label: r.label,
        amount: String(oreToKroner(r.amount).toNumber()),
        note: r.note ?? '',
      })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  const save = handleSubmit(async ({ title, rows }) => {
    const next: ExpenseTable = {
      title: title.trim() || defaultTitle,
      rows: rows.map((r) => ({
        id: genId(),
        label: r.label.trim(),
        amount: parse(r.amount),
        ...(r.note.trim() ? { note: r.note.trim() } : {}),
      })),
    };
    await updateCustomExpenseTable(loan.id, tableKey, next);
    onDone();
  });

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Tabel-titel" />
        )}
      />
      {fields.map((field, index) => (
        <View key={field.id} className="gap-2 rounded-xl bg-element p-2">
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Controller
                control={control}
                name={`rows.${index}.label`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Post" />
                )}
              />
            </View>
            <View className="w-24">
              <Controller
                control={control}
                name={`rows.${index}.amount`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="kr." />
                )}
              />
            </View>
            <Pressable accessibilityRole="button" onPress={() => remove(index)}>
              <AppText className="text-danger">✕</AppText>
            </Pressable>
          </View>
          <Controller
            control={control}
            name={`rows.${index}.note`}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Note (valgfri)" />
            )}
          />
        </View>
      ))}
      <Button title="Tilføj række" variant="secondary" onPress={() => append({ label: '', amount: '', note: '' })} />
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
