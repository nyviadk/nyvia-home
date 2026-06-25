import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Flet Tailwind-klasser sammen og håndtér konflikter (sidste vinder). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
