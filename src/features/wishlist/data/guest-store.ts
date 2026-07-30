import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistOptions } from '@/lib/storage/persist-options';

/**
 * Hvem gæsten er, mens de bruger den delte liste.
 *
 * Lå før som `useState` i BÅDE oversigten og reservations-skærmen, så navnet forsvandt så snart
 * man navigerede — man skulle skrive det igen på hver side. Som store deles det på tværs (og
 * huskes til næste besøg), og der er kun ét sted der ejer værdien.
 */
interface GuestState {
  name: string;
}

export const useGuestStore = create<GuestState>()(
  persist(() => ({ name: '' }), persistOptions<GuestState>('wishlist-guest', ['name'])),
);

export function setGuestName(name: string): void {
  useGuestStore.setState({ name });
}
