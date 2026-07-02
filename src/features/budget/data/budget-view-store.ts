import { create } from "zustand";
import { persist } from "zustand/middleware";

import { persistOptions } from "@/lib/storage/persist-options";
import type { ForecastMode } from "../forecast";

/** UI-valg for hvordan månederne vises (hensat/udjævnet vs. realistisk). Ingen DB — men
 *  persisteres lokalt, så valget huskes mellem sessioner. */
interface BudgetViewState {
  mode: ForecastMode;
}

export const useBudgetViewStore = create<BudgetViewState>()(
  persist(
    () => ({ mode: "realistic" as ForecastMode }),
    persistOptions<BudgetViewState>("budget-view", ["mode"])
  )
);

export function setBudgetViewMode(mode: ForecastMode): void {
  useBudgetViewStore.setState({ mode });
}
