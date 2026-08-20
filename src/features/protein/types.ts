/** Måltidets plads på dagen. Rækkefølgen her er også visningsrækkefølgen. */
export type MealSlot = 'morgen' | 'frokost' | 'aften' | 'snack';

export const MEAL_SLOTS: { value: MealSlot; label: string }[] = [
  { value: 'morgen', label: 'Morgen' },
  { value: 'frokost', label: 'Frokost' },
  { value: 'aften', label: 'Aften' },
  { value: 'snack', label: 'Snack' },
];

export const mealLabel = (slot: MealSlot) =>
  MEAL_SLOTS.find((m) => m.value === slot)?.label ?? slot;

/**
 * Hvordan tallene på en ret er tastet ind.
 *
 * `per100g` er som det står på emballagen — man skriver af, i stedet for at regne om til
 * sin egen portion i hovedet. Det er den vej man har tallene når man køber noget.
 * `portion` er til alt det der ikke har en pakke: en ret man selv har lavet, tre æg, en
 * portion aftensmad. Der findes intet "pr. 100 g" for "kødsauce med pasta".
 */
export type FoodBasis = 'per100g' | 'portion';

export const FOOD_BASIS: { value: FoodBasis; label: string }[] = [
  { value: 'per100g', label: 'Pr. 100 g' },
  { value: 'portion', label: 'Pr. portion' },
];

/**
 * En ret i kataloget — en genbrugelig skabelon, ikke noget der er spist.
 *
 * Tallene gemmes SOM DE ER TASTET, sammen med portionsstørrelsen, og portionen udregnes
 * ved brug (`serving`). Alternativet — at gemme det udregnede og smide grundlaget væk —
 * gør posten uredigerbar: opdager man at portionen er 180 g og ikke 150 g, skal man
 * regne baglæns for at finde ud af hvad der stod på pakken.
 *
 * type-alias (ikke interface) → tildelbar til Record<string, unknown> for db-facaden.
 */
export type ProteinFood = {
  name: string;
  basis: FoodBasis;
  /** Gram protein — pr. 100 g eller for hele portionen, jf. `basis`. */
  proteinValue: number;
  /** Kilokalorier — samme grundlag som `proteinValue`. */
  kcalValue: number;
  /** Portionens vægt i gram. Kun ved `per100g`; ellers er portionen selve grundlaget. */
  portionG?: number;
  /** Hvilken sektion retten foreslås under. Man kan logge den når som helst. */
  meal: MealSlot;
  /**
   * Skjult fra kataloget. Startlisten er bred med vilje, og halvdelen af den passer ikke
   * til den enkelte — men at SLETTE en ret man måske spiser om et halvt år er en dårlig
   * handel. Skjul er fortrydeligt og koster ingenting; sletning er der stadig ved siden af.
   */
  hidden?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProteinFoodInput = Pick<
  ProteinFood,
  'name' | 'basis' | 'proteinValue' | 'kcalValue' | 'portionG' | 'meal'
>;

/** Hvad ÉN portion af retten indeholder. Det eneste tal resten af appen regner med. */
export function serving(food: Pick<ProteinFood, 'basis' | 'proteinValue' | 'kcalValue' | 'portionG'>): {
  proteinG: number;
  kcal: number;
} {
  if (food.basis === 'portion') {
    return { proteinG: food.proteinValue, kcal: food.kcalValue };
  }
  const factor = (food.portionG ?? 100) / 100;
  // Protein med én decimal, kalorier i hele tal: 0,4 g protein flytter ikke noget, men
  // afrunder man det væk på tyve poster, mangler der pludselig 8 g i dagsregnskabet.
  return {
    proteinG: Math.round(food.proteinValue * factor * 10) / 10,
    kcal: Math.round(food.kcalValue * factor),
  };
}

/** Portionen skrevet ud, fx "150 g" — tom for retter der ikke har en vægt. */
export const portionLabel = (food: Pick<ProteinFood, 'basis' | 'portionG'>): string =>
  food.basis === 'per100g' && food.portionG ? `${food.portionG} g` : '';


/**
 * Én ting du har spist.
 *
 * Navn og tal er en KOPI af retten på det tidspunkt den blev logget, ikke en reference.
 * Retter man senere kaloriemængden i kataloget, må gårsdagens regnskab ikke ændre sig
 * bagud — det ville gøre historikken til gætværk. `foodId` er derfor kun et spor tilbage
 * til skabelonen (til statistik og "spis den igen"), aldrig kilden til tallene.
 */
export type ProteinLogEntry = {
  /** ISO-dag, YYYY-MM-DD, i Europe/Copenhagen. */
  day: string;
  name: string;
  proteinG: number;
  kcal: number;
  /** Antal portioner. Tallene ovenfor er PR. PORTION. */
  qty: number;
  meal: MealSlot;
  /** Sat når posten kom fra kataloget. Retten kan være slettet siden. */
  foodId?: string;
  /** Sat for hurtig-knappen "ukendt måltid", så gennemsnittene kan kendes fra rigtige tal. */
  estimated?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProteinLogInput = Pick<
  ProteinLogEntry,
  'day' | 'name' | 'proteinG' | 'kcal' | 'qty' | 'meal' | 'foodId' | 'estimated'
>;

/** Målene. Redigerbare i appen — de er personlige og ændrer sig med vægt og træning. */
export type ProteinSettings = {
  proteinGoalG: number;
  kcalGoalKcal: number;
  /** Gennemsnittet der bruges når man trykker "ukendt måltid". */
  unknownProteinG: number;
  unknownKcal: number;
  updatedAt: string;
};

export const DEFAULT_SETTINGS = {
  proteinGoalG: 120,
  kcalGoalKcal: 2800,
  /**
   * Et almindeligt dansk måltid man ikke selv har lavet. Bevidst sat en anelse LAVT på
   * protein og en anelse HØJT på kalorier: gætter man forkert, er det den fejl der får en
   * til at spise mere protein og mindre energi, hvilket er den retning målet peger i.
   */
  unknownProteinG: 25,
  unknownKcal: 600,
} as const;
