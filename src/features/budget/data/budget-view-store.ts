import { create } from "zustand";

import type { ForecastMode } from "../forecast";

/** UI-valg for hvordan månederne vises (hensat/udjævnet vs. realistisk). Ingen DB. */
interface BudgetViewState {
  mode: ForecastMode;
}

export const useBudgetViewStore = create<BudgetViewState>(() => ({
  mode: "realistic",
}));

export function setBudgetViewMode(mode: ForecastMode): void {
  useBudgetViewStore.setState({ mode });
}
