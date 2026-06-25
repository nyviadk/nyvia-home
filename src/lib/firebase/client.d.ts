// Type-deklaration for det platform-splittede klient-modul.
// Runtime leveres af client.web.ts (web) og client.native.ts (native);
// TypeScript bruger denne .d.ts til typerne. Ingen `any`.
import type { AuthFacade, DbFacade } from './facade';

export const auth: AuthFacade;
export const db: DbFacade;
