import { z } from 'zod';

import type { Home, HomeInput, Landlord } from '../types';

export const homeFormSchema = z.object({
  address: z.string().trim().min(1, 'Adresse kræves'),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(['kommende', 'nuværende', 'tidligere']),
  moveInDate: z.string().optional(),
  moveOutDate: z.string().optional(),
  landlordName: z.string().optional(),
  landlordPhone: z.string().optional(),
  landlordEmail: z.string().optional(),
  landlordRegNo: z.string().optional(),
  landlordAccountNo: z.string().optional(),
  landlordAddress: z.string().optional(),
  landlordNotes: z.string().optional(),
});

export type HomeFormValues = z.infer<typeof homeFormSchema>;

export function toHomeFormValues(home?: Home): HomeFormValues {
  const l = home?.landlord ?? {};
  return {
    address: home?.address ?? '',
    postalCode: home?.postalCode ?? '',
    city: home?.city ?? '',
    status: home?.status ?? 'kommende',
    moveInDate: home?.moveInDate ?? '',
    moveOutDate: home?.moveOutDate ?? '',
    landlordName: l.name ?? '',
    landlordPhone: l.phone ?? '',
    landlordEmail: l.email ?? '',
    landlordRegNo: l.regNo ?? '',
    landlordAccountNo: l.accountNo ?? '',
    landlordAddress: l.address ?? '',
    landlordNotes: l.notes ?? '',
  };
}

/** Kun-hvis-udfyldt-spread (Firestore tillader ikke undefined). */
const opt = <K extends string>(key: K, value: string | undefined): Partial<Record<K, string>> => {
  const t = value?.trim();
  return t ? ({ [key]: t } as Record<K, string>) : {};
};

export function toHomeInput(v: HomeFormValues): HomeInput {
  const landlord: Landlord = {
    ...opt('name', v.landlordName),
    ...opt('phone', v.landlordPhone),
    ...opt('email', v.landlordEmail),
    ...opt('regNo', v.landlordRegNo),
    ...opt('accountNo', v.landlordAccountNo),
    ...opt('address', v.landlordAddress),
    ...opt('notes', v.landlordNotes),
  };

  return {
    address: v.address.trim(),
    status: v.status,
    ...opt('postalCode', v.postalCode),
    ...opt('city', v.city),
    ...opt('moveInDate', v.moveInDate),
    ...opt('moveOutDate', v.moveOutDate),
    ...(Object.keys(landlord).length > 0 ? { landlord } : {}),
  };
}
