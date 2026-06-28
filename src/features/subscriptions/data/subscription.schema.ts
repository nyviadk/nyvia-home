import { z } from "zod";

import { recurrenceWithBudgetStart } from "@/features/budget/data/recurrence-validation";
import { defaultStartDate } from "@/features/budget/data/budget-start";
import { oreToInput, parseKronerInput } from "@/lib/money";
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

export const subscriptionFormSchema = z
  .object({
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
    // Introtilbud (nykunde): én stor betaling i startmåneden, derefter normalpris.
    introEnabled: z.boolean(),
    introAmount: z.string().optional(),
    introMonths: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.introEnabled) return;
    const ore = parseKronerInput(v.introAmount ?? "");
    if (ore === null || ore < 0) {
      ctx.addIssue({ path: ["introAmount"], code: "custom", message: "Introbeløb kræves" });
    }
    const months = Number.parseInt(v.introMonths ?? "", 10);
    if (!Number.isFinite(months) || months < 1) {
      ctx.addIssue({ path: ["introMonths"], code: "custom", message: "Antal måneder kræves" });
    }
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
      introEnabled: false,
      introAmount: "",
      introMonths: "",
    };
  }
  return {
    name: sub.name,
    amount: oreToInput(sub.amount),
    category: sub.category,
    active: sub.active,
    note: sub.note ?? "",
    recurrence: fromRecurrence(sub.recurrence),
    introEnabled: !!sub.intro,
    introAmount: sub.intro ? oreToInput(sub.intro.amountOre) : "",
    introMonths: sub.intro ? String(sub.intro.months) : "",
  };
}

export function toSubscriptionInput(
  values: SubscriptionFormValues,
): SubscriptionInput {
  const note = values.note?.trim();
  const intro = values.introEnabled
    ? {
        amountOre: parseKronerInput(values.introAmount ?? "") ?? 0,
        months: Math.max(1, Number.parseInt(values.introMonths ?? "1", 10) || 1),
      }
    : undefined;
  return {
    name: values.name.trim(),
    amount: parseKronerInput(values.amount) ?? 0,
    category: values.category,
    active: values.active,
    recurrence: toRecurrence(values.recurrence),
    ...(note ? { note } : {}),
    ...(intro ? { intro } : {}),
  };
}
