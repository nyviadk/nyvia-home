import { z } from "zod";

import { recurrenceWithBudgetStart } from "@/features/budget/data/recurrence-validation";
import { defaultStartDate } from "@/features/budget/data/budget-start";
import { oreToKroner, parseKronerInput } from "@/lib/money";
import {
  defaultRecurrenceForm,
  fromRecurrence,
  toRecurrence,
} from "@/lib/recurrence/recurrence-form";
import type { Subscription, SubscriptionInput } from "../types";

const moneyField = z.string().refine(
  (s) => {
    const ore = parseKronerInput(s);
    return ore !== null && ore >= 0;
  },
  { message: "Beløb skal være et gyldigt tal" },
);

export const subscriptionFormSchema = z.object({
  name: z.string().trim().min(1, "Navn kræves"),
  amount: moneyField,
  category: z.enum([
    "forsikring",
    "skatteservice",
    "ai",
    "internet",
    "mobil",
    "streaming",
    "kontingent",
    "andet",
  ]),
  active: z.boolean(),
  note: z.string().optional(),
  recurrence: recurrenceWithBudgetStart,
});

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

export function toSubscriptionFormValues(
  sub?: Subscription,
  budgetStart: string | null = null,
): SubscriptionFormValues {
  if (!sub) {
    return {
      name: "",
      amount: "",
      category: "streaming",
      active: true,
      note: "",
      recurrence: defaultRecurrenceForm(defaultStartDate(budgetStart)),
    };
  }
  return {
    name: sub.name,
    amount: String(oreToKroner(sub.amount).toNumber()),
    category: sub.category,
    active: sub.active,
    note: sub.note ?? "",
    recurrence: fromRecurrence(sub.recurrence),
  };
}

export function toSubscriptionInput(
  values: SubscriptionFormValues,
): SubscriptionInput {
  const note = values.note?.trim();
  return {
    name: values.name.trim(),
    amount: parseKronerInput(values.amount) ?? 0,
    category: values.category,
    active: values.active,
    recurrence: toRecurrence(values.recurrence),
    ...(note ? { note } : {}),
  };
}
