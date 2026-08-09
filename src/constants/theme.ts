/**
 * De få design-tokens der skal bruges som RÅ hex i JS.
 *
 * Alt andet styles med className. Undtagelsen er navigator-options (header, TabList) og
 * andre React-Navigation-props, som tager en farve-værdi og ikke en klasse. Værdierne
 * SKAL matche `--color-*` i `src/global.css`; de lå før hardkodet i tre filer.
 */
export const THEME_HEX = {
  card: '#ffffff',
  fg: '#2a2a28',
  border: '#e8e3da',
  primary: '#2f7d6b',
} as const;
