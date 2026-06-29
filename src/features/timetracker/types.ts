/** Et tidsregistrerings-punkt. Varighed gemmes som heltal minutter (let at summere/grafere). */
export type TimeEntry = {
  /** Dagen arbejdet hører til (startdagen), ÅÅÅÅ-MM-DD. */
  date: string;
  /** Starttid HH:mm. */
  startTime: string;
  /** Sluttid HH:mm (valgfri — null/udeladt = mangler; før start = natarbejde, slutter næste dag). */
  endTime?: string | null;
  /** Varighed i minutter (heltal; 0 hvis sluttid mangler). Håndterer natarbejde over midnat. */
  durationMinutes: number;
  /** Funktion/kategori, fx "Udvikling". */
  category: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type TimeEntryInput = Pick<
  TimeEntry,
  'date' | 'startTime' | 'endTime' | 'durationMinutes' | 'category' | 'description'
>;

/** Indstillinger for timetracker (ét dokument pr. bruger). */
export type TimetrackerSettings = {
  /** Officiel projektstart (ÅÅÅÅ-MM-DD) — skille-punkt i oversigten. */
  officialStartDate?: string;
  updatedAt: string;
};
