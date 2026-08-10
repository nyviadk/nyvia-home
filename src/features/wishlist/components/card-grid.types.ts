import type { ReactNode } from 'react';

/**
 * Delt kontrakt for de to `CardGrid`-implementeringer (web = CSS-grid, native = måling).
 * Ligger for sig selv, fordi platform-splittede filer ikke kan importere fra hinanden —
 * Metro ville vælge `.web` for begge.
 */
export interface CardGridProps<T> {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  gap?: number;
  /** Under denne bredde falder grid'et til færre kolonner. */
  minColumnWidth?: number;
  maxColumns?: number;
}
