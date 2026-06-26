import type { ReactNode } from 'react';

/** Native: gennemsigtig wrapper (submit håndteres af knappen). */
export function Form({ children }: { children: ReactNode; onSubmit?: () => void }) {
  return <>{children}</>;
}
