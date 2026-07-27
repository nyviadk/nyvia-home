/** En af de 3 blinde vinkler + kategorien "generelle støtte-linser". Fast config, ikke data. */
export type PlanioSpot = 'scale' | 'async' | 'trust' | 'generelle';

/** Styrer bloat: kun kritisk + tilbagevendende injiceres i prompterne; enkelt ligger kun i arkivet. */
export type PlanioWeight = 'kritisk' | 'tilbagevendende' | 'enkelt';

/** En lektion (den aktive viden — fodrer review-prompterne). */
export type PlanioLesson = {
  spot: PlanioSpot;
  weight: PlanioWeight;
  /** Lektion på klasse-niveau. */
  lesson: string;
  /** Den centrale klasse-fix. */
  fix: string;
  /** Valgfri kilde, fx "PROD-214" — kun metadata, ikke organisering. */
  src?: string;
  createdAt: string;
};

export type PlanioLessonInput = Pick<PlanioLesson, 'spot' | 'weight' | 'lesson' | 'fix' | 'src'>;

/**
 * Rå feedback (arkiv — gemmes, søgbar, men injiceres ALDRIG i review-prompterne).
 * `prodId` + `feature` kobler en entry til en konkret feature; flere entries med samme par =
 * flere feedback-runder (ingen særlig round-model). Fase 3 (Løs feedback) grupperer på dem.
 */
export type PlanioRaw = {
  text: string;
  prodId?: string;
  feature?: string;
  /** Ældre entries: fri kilde-streng (fx "PROD-214 · mentor"). */
  src?: string;
  createdAt: string;
};

export type PlanioRawInput = Pick<PlanioRaw, 'text' | 'prodId' | 'feature' | 'src'>;

/**
 * Global false positive fra Fase 1's Fallow-tjek — noget Fallow flager som dødt, men som reelt
 * bruges (dynamiske string-refs, framework-magi). Ét globalt sæt (ikke pr. scope); injiceres i
 * Pass 1, så Claude springer dem over.
 */
export type PlanioFalsePositive = {
  text: string;
  createdAt: string;
};

export type PlanioFalsePositiveInput = Pick<PlanioFalsePositive, 'text'>;

export const WEIGHT_LABELS: Record<PlanioWeight, string> = {
  kritisk: 'kritisk',
  tilbagevendende: 'tilbagevendende',
  enkelt: 'enkelt',
};
