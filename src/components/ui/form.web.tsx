import { createElement, type ReactNode } from 'react';

/**
 * Web: et rigtigt <form>-element, så password-felter ligger i en form
 * (password-manager-autofyld + Enter-to-submit). `display: contents` gør at
 * formen ikke påvirker layoutet. Native-varianten er en gennemsigtig wrapper.
 */
export function Form({ children, onSubmit }: { children: ReactNode; onSubmit?: () => void }) {
  return createElement(
    'form',
    {
      style: { display: 'contents' },
      onSubmit: (event: { preventDefault: () => void }) => {
        event.preventDefault();
        onSubmit?.();
      },
    },
    children
  );
}
