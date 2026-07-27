import type { PlanioSpot } from './types';

/** Én blind vinkel + dens støtte-linser. FAST config (ikke en collection) — teksten er
 *  produktet og porteres 1:1 fra prototypens `SPOTS`. accent/bg er badge-farver (rå hex, da
 *  de er data-drevne pr. vinkel, ikke tema-tokens). */
export type SpotConfig = {
  id: PlanioSpot;
  name: string;
  tag: string;
  accent: string;
  bg: string;
  lenses: string[];
};

export const SPOTS: SpotConfig[] = [
  {
    id: 'scale',
    name: 'Skala',
    tag: 'Den flade — følger dig overalt',
    accent: '#d97706',
    bg: '#fef3c7',
    lenses: ['Skala & grænser — max-N vs hård grænse (batch 500, memory, page size)?'],
  },
  {
    id: 'async',
    name: 'Det asynkrone',
    tag: 'Retries og partiel fejl mellem services',
    accent: '#4f46e5',
    bg: '#eef2ff',
    lenses: [
      'Idempotens — kører side-effect to gange parallelt → dubletter?',
      'Recovery — self-healing eller stuck? permanent vs midlertidig?',
      'Config-drift — deadline < ventetid?',
    ],
  },
  {
    id: 'trust',
    name: 'Fjendtlig kalder',
    tag: 'Server-authored trust',
    accent: '#7c3aed',
    bg: '#f5f3ff',
    lenses: ['Trust boundary — forfalskes fra curl? server- vs klient-ejede felter?'],
  },
  {
    id: 'api',
    name: 'API-kontrakt',
    tag: "Eksterne API'ers edge-cases — læs kontrakten",
    accent: '#0d9488',
    bg: '#ccfbf1',
    lenses: [
      'Pagination — følg continuation-token til ende; ét kald ≠ hele listen',
      'Gensidigt udelukkende parametre — hvad må ikke sendes sammen?',
      'Gør operationen reelt det, den påstår? (observerbar tilstand, ikke bare et ID)',
      'Udled ikke fra et succes-signal — verificér forudsætningen eksplicit',
    ],
  },
  {
    id: 'generelle',
    name: 'Generelle støtte-linser',
    tag: 'Gælder bredt',
    accent: '#475569',
    bg: '#f1f5f9',
    lenses: [
      'API-kontrakt — udleder jeg fra et succes-signal? docs’ edge cases?',
      'Framework-purity — ren updater, sikker ved dobbelt-kald?',
    ],
  },
];

export const spotConfig = (id: PlanioSpot): SpotConfig | undefined => SPOTS.find((s) => s.id === id);
export const spotName = (id: PlanioSpot): string => spotConfig(id)?.name ?? id;
