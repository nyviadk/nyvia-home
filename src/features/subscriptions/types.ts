import type { Recurrence } from "@/lib/recurrence/types";
import type { PriceChange } from "@/features/budget/types";

export type SubscriptionCategory =
  | "forsikring"
  | "ai"
  | "skatteservice"
  | "internet"
  | "mobil"
  | "streaming"
  | "kontingent"
  | "andet";

/** Et fast abonnement/forsikring (altid en udgift). Beløb i øre, positivt. */
export type Subscription = {
  name: string;
  amount: number;
  category: SubscriptionCategory;
  recurrence: Recurrence;
  active: boolean;
  /** Prisændringer "denne og fremover" (abonnementer stiger ofte over tid). */
  priceChanges?: PriceChange[];
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionInput = Pick<
  Subscription,
  "name" | "amount" | "category" | "recurrence" | "active" | "note"
>;

export const SUBSCRIPTION_CATEGORIES: {
  value: SubscriptionCategory;
  label: string;
}[] = [
  { value: "forsikring", label: "Forsikring" },
  { value: "skatteservice", label: "Skatteservice" },
  { value: "ai", label: "AI" },
  { value: "internet", label: "Internet" },
  { value: "mobil", label: "Mobil" },
  { value: "streaming", label: "Streaming" },
  { value: "kontingent", label: "Kontingent" },
  { value: "andet", label: "Andet" },
];
