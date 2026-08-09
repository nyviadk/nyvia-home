import type { Href } from 'expo-router';

/**
 * Appens navigations-model — ÉN kilde for begge skaller.
 *
 * Web bruger `expo-router/ui` Tabs (sidebar/bund-bar), native bruger `expo-router/drawer`.
 * De to skaller er nødt til at være forskellige (uforenelige API'er), men rækkefølgen,
 * etiketterne og accent-farverne er de samme. Før stod de beskrevet to gange i to
 * forskellige datastrukturer, så en ny feature krævede rettelser fire steder — og de kunne
 * drive fra hinanden i tavshed.
 */
export interface FeatureNavItem {
  /** Rutens mappenavn under `src/app/(app)/`. */
  name: string;
  /** `Href` og ikke `string`: typed-routes validerer stien mod de faktiske ruter. */
  href: Href;
  label: string;
  /** Tailwind tekst-farveklasse for aktiv tilstand (web-sidebaren). */
  accent: string;
  /**
   * Skjult i den native drawer. Begge nuværende tilfælde er web-features (Planio kører kun
   * på web; Evis følsomme felter kan kun dekrypteres der), så de fyldte bare på telefonen.
   * Ruten er stadig registreret — et direkte link virker.
   */
  nativeHidden?: true;
}

/** Forsiden. Står for sig: på web ER logoet dens trigger, på native er den et menupunkt. */
export const HOME_ITEM = { name: 'index', href: '/', label: 'Forside' } as const;

/** Indstillinger. Står for sig: pinnet i BUNDEN af begge skaller. */
export const SETTINGS_ITEM: FeatureNavItem = {
  name: 'settings',
  href: '/settings',
  label: 'Indstillinger',
  accent: 'text-fg',
};

/** Feature-punkterne i menu-rækkefølge (uden forside og indstillinger). */
export const FEATURE_NAV: readonly FeatureNavItem[] = [
  { name: 'homes', href: '/homes', label: 'Hjem', accent: 'text-accent-moving' },
  { name: 'budget', href: '/budget', label: 'Budget', accent: 'text-accent-budget' },
  { name: 'spending', href: '/spending', label: 'Forbrug', accent: 'text-accent-spending' },
  { name: 'loans', href: '/loans', label: 'Lån', accent: 'text-accent-loans' },
  { name: 'subscriptions', href: '/subscriptions', label: 'Abonnementer', accent: 'text-primary' },
  { name: 'timetracker', href: '/timetracker', label: 'Timetracker', accent: 'text-accent-time' },
  { name: 'evi', href: '/evi', label: 'Evi', accent: 'text-accent-evi', nativeHidden: true },
  { name: 'planio', href: '/planio', label: 'My Planio', accent: 'text-accent-planio', nativeHidden: true },
  { name: 'onskeliste', href: '/onskeliste', label: 'Ønskeliste', accent: 'text-accent-wishlist' },
];

/** Etiket for et rutenavn — draweren får kun navnet fra navigatorens state. */
export const navLabel = (name: string): string =>
  name === HOME_ITEM.name
    ? HOME_ITEM.label
    : name === SETTINGS_ITEM.name
      ? SETTINGS_ITEM.label
      : (FEATURE_NAV.find((f) => f.name === name)?.label ?? name);

/** Rutenavne der ikke skal have en indgang i den native drawer. */
export const NATIVE_HIDDEN: readonly string[] = FEATURE_NAV.filter((f) => f.nativeHidden).map(
  (f) => f.name
);
