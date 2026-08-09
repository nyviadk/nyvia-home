import { create } from 'zustand';

/**
 * Id'er der er optimistisk slettet (skjult i UI), men endnu ikke skrevet til DB.
 *
 * Bevidst IKKE persisteret: tilstanden er transient og hører til fortryd-vinduet. Lukker man
 * appen midt i vinduet, når skrivningen aldrig at ske, og posten skal være der igen.
 * Lå før kopieret ordret i seks features.
 */
export function createPendingDeletes() {
  const useStore = create<{ ids: ReadonlySet<string> }>(() => ({ ids: new Set() }));

  const edit = (ids: string | string[], apply: (set: Set<string>, id: string) => void) =>
    useStore.setState((s) => {
      const next = new Set(s.ids);
      for (const id of Array.isArray(ids) ? ids : [ids]) apply(next, id);
      return { ids: next };
    });

  return {
    useStore,
    /** Skjul ét eller flere id'er (bulk-sletninger skjuler hele sættet på én gang). */
    mark: (ids: string | string[]) => edit(ids, (set, id) => set.add(id)),
    unmark: (ids: string | string[]) => edit(ids, (set, id) => set.delete(id)),
  };
}

export type PendingDeletes = ReturnType<typeof createPendingDeletes>;

/** Filtrér de optimistisk slettede fra en liste. Erstatter det gentagne `.filter(!ids.has(...))`. */
export function withoutPending<T extends { id: string }>(
  items: readonly T[],
  ids: ReadonlySet<string>
): T[] {
  return ids.size === 0 ? (items as T[]) : items.filter((i) => !ids.has(i.id));
}
