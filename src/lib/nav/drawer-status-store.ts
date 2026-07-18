import { create } from 'zustand';

/**
 * Drawerens åben/luk-status som global store. Toasteren ligger i app-roden (uden for
 * drawer-navigatorens kontekst) og kan derfor ikke selv kalde `useDrawerStatus` — den læser
 * i stedet herfra, så en toast kan gemme sig bag draweren når den er åben.
 *
 * Kun native: web-skallen bruger en sidebar (ingen Drawer), så status forbliver `false`.
 */
interface DrawerStatusState {
  open: boolean;
}

export const useDrawerStatusStore = create<DrawerStatusState>()(() => ({ open: false }));

export function setDrawerOpen(open: boolean): void {
  // Skriv kun ved reel ændring → ingen unødige re-renders af Toasteren.
  if (useDrawerStatusStore.getState().open !== open) {
    useDrawerStatusStore.setState({ open });
  }
}
