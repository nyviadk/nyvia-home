import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/empty-state';

/**
 * Tom-tilstanden for en liste: viser INTET mens der hentes, tom-teksten hvis der ikke er
 * noget, ellers indholdet.
 *
 * Rækkefølgen er pointen. Den lå som `{n === 0 ? (loading ? null : <EmptyState/>) : …}` på
 * seks skærme — en indlejret ternary med et `null`-ben, som er nem at vende forkert.
 * Ingen spinner: de fleste lister males fra den persisterede cache og er der med det samme,
 * så en spinner ville blinke mere end den beroliger.
 */
export function ListGate({
  count,
  loading,
  empty,
  children,
}: {
  count: number;
  loading: boolean;
  empty: { title: string; description: string };
  children: ReactNode;
}) {
  if (count > 0) return <>{children}</>;
  if (loading) return null;
  return <EmptyState title={empty.title} description={empty.description} />;
}
