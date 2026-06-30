export type AddressChangeStatus = 'ikke_startet' | 'afventer' | 'færdig';

export const ADDRESS_CHANGE_STATUSES: { value: AddressChangeStatus; label: string }[] = [
  { value: 'ikke_startet', label: 'Ikke startet' },
  { value: 'afventer', label: 'Afventer' },
  { value: 'færdig', label: 'Færdig' },
];

/** "Hvem skal have min nye adresse" — global liste (genbruges på tværs af flytninger). */
export type AddressChange = {
  name: string;
  status: AddressChangeStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AddressChangeInput = Pick<AddressChange, 'name' | 'status' | 'notes'>;
