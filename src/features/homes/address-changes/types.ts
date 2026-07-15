export type AddressChangeStatus = 'ikke_startet' | 'afventer' | 'færdig';

/** Farve-tone pr. status: rød (ikke startet) · gul (afventer) · grøn (færdig). */
export type StatusTone = 'danger' | 'warning' | 'success';

export const ADDRESS_CHANGE_STATUSES: {
  value: AddressChangeStatus;
  label: string;
  tone: StatusTone;
}[] = [
  { value: 'ikke_startet', label: 'Ikke startet', tone: 'danger' },
  { value: 'afventer', label: 'Afventer', tone: 'warning' },
  { value: 'færdig', label: 'Færdig', tone: 'success' },
];

export const STATUS_TONE: Record<AddressChangeStatus, StatusTone> = {
  ikke_startet: 'danger',
  afventer: 'warning',
  færdig: 'success',
};

/** "Hvem skal have min nye adresse" — global liste (genbruges på tværs af flytninger). */
export type AddressChange = {
  name: string;
  status: AddressChangeStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AddressChangeInput = Pick<AddressChange, 'name' | 'status' | 'notes'>;
