import { create } from "zustand";
import { persist } from "zustand/middleware";

import { persistOptions } from "@/lib/storage/persist-options";
import type { ForecastMode } from "../forecast";

/** UI-valg for hvordan månederne vises (hensat/udjævnet vs. realistisk) + om tidligere
 *  måneder er foldet ud. Ingen DB — men persisteres lokalt, så valget huskes mellem sessioner. */
interface BudgetViewState {
  mode: ForecastMode;
  showPast: boolean;
}

export const useBudgetViewStore = create<BudgetViewState>()(
  persist(
    () => ({ mode: "realistic" as ForecastMode, showPast: false }),
    persistOptions<BudgetViewState>("budget-view", ["mode", "showPast"])
  )
);

export function setBudgetViewMode(mode: ForecastMode): void {
  useBudgetViewStore.setState({ mode });
}

export function toggleBudgetPast(): void {
  useBudgetViewStore.setState((s) => ({ showPast: !s.showPast }));
}
