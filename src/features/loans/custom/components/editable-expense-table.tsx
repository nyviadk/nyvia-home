import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { MoneyText } from "@/components/ui/money-text";
import { AppText } from "@/components/ui/text";
import type { WithId } from "@/lib/firebase";
import { genId } from "@/lib/id";
import { oreToInput } from "@/lib/money";
import { Pressable, View } from "@/tw";
import { updateCustomExpenseTable } from "../../data/loans.repository";
import { expenseTotalOre } from "../calc";
import { type EntryKind, kindOf, toSignedOre } from "../form";
import type { CustomLoan, ExpenseRow, ExpenseTable } from "../types";

type TableKey = "newHome" | "oldHome";
type RowForm = { label: string; amount: string; kind: EntryKind; note: string };
type TableForm = { title: string; rows: RowForm[] };

const absStr = (ore: number) => oreToInput(Math.abs(ore));

export interface EditableExpenseTableProps {
  loan: WithId<CustomLoan>;
  tableKey: TableKey;
  defaultTitle: string;
}

export function EditableExpenseTable({
  loan,
  tableKey,
  defaultTitle,
}: EditableExpenseTableProps) {
  const [editing, setEditing] = useState(false);
  const table = loan[tableKey];

  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between">
        <AppText variant="heading">{table.title || defaultTitle}</AppText>
        {!editing ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(true)}
          >
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

function RowLine({ row }: { row: ExpenseRow }) {
  return (
    <View className="flex-row items-start justify-between gap-2">
      <View className="flex-1">
        <AppText variant="body">{row.label}</AppText>
        {row.note ? <AppText variant="muted">{row.note}</AppText> : null}
      </View>
      <MoneyText ore={Math.abs(row.amount)} whole variant="body" />
    </View>
  );
}

function ReadView({ table }: { table: ExpenseTable }) {
  const expenses = table.rows.filter((r) => r.amount >= 0);
  const incomes = table.rows.filter((r) => r.amount < 0);

  return (
    <>
      {table.rows.length === 0 ? (
        <AppText variant="muted">Ingen poster.</AppText>
      ) : null}

      {expenses.length > 0 ? (
        <View className="gap-1">
          <AppText variant="muted">Udgifter</AppText>
          {expenses.map((row) => (
            <RowLine key={row.id} row={row} />
          ))}
        </View>
      ) : null}

      {incomes.length > 0 ? (
        <View className="mt-2 gap-1">
          <AppText variant="muted">Indtægter</AppText>
          {incomes.map((row) => (
            <RowLine key={row.id} row={row} />
          ))}
        </View>
      ) : null}

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
        amount: absStr(r.amount),
        kind: kindOf(r.amount),
        note: r.note ?? "",
      })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "rows" });

  const save = handleSubmit(async ({ title, rows }) => {
    const next: ExpenseTable = {
      title: title.trim() || defaultTitle,
      rows: rows.map((r) => ({
        id: genId(),
        label: r.label.trim(),
        amount: toSignedOre(r.amount, r.kind),
        ...(r.note.trim() ? { note: r.note.trim() } : {}),
      })),
    };
    await updateCustomExpenseTable(loan.id, tableKey, next);
    onDone();
  });

  const allRows = fields.map((field, index) => ({ field, index }));
  const expenseRows = allRows.filter((r) => r.field.kind === "expense");
  const incomeRows = allRows.filter((r) => r.field.kind === "income");

  const renderRow = ({
    field,
    index,
  }: {
    field: { id: string };
    index: number;
  }) => (
    <View key={field.id} className="gap-2 rounded-xl bg-element p-2">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Controller
            control={control}
            name={`rows.${index}.label`}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Post"
              />
            )}
          />
        </View>
        <View className="w-24">
          <Controller
            control={control}
            name={`rows.${index}.amount`}
            render={({ field: { onChange, onBlur, value } }) => (
              <MoneyInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="kr."
              />
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
          <Input
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Note (valgfri)"
          />
        )}
      />
    </View>
  );

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Tabel-titel"
          />
        )}
      />

      <View className="gap-2 rounded-xl border border-border p-3">
        <AppText variant="label">Udgifter</AppText>
        {expenseRows.map(renderRow)}
        <Button
          title="Tilføj udgift"
          variant="secondary"
          onPress={() =>
            append({ label: "", amount: "", kind: "expense", note: "" })
          }
        />
      </View>

      <View className="gap-2 rounded-xl border border-border p-3">
        <AppText variant="label">Indtægter</AppText>
        {incomeRows.map(renderRow)}
        <Button
          title="Tilføj indtægt"
          variant="secondary"
          onPress={() =>
            append({ label: "", amount: "", kind: "income", note: "" })
          }
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
