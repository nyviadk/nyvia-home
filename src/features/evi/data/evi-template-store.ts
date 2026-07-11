import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { auth, type Unsubscribe } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';
import { persistOptions } from '@/lib/storage/persist-options';
import type { EviField } from '../types';
import { parseTemplateFields } from './evi.schema';
import { subscribeEviTemplate } from './evi-template.repository';

interface EviTemplateState {
  fields: EviField[];
  loading: boolean;
}

export const useEviTemplateStore = create<EviTemplateState>()(
  persist(
    () => ({ fields: [], loading: true }),
    persistOptions<EviTemplateState>('evi-template', ['fields']),
  ),
);

let unsubscribe: Unsubscribe | null = null;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeEviTemplate(
    (doc) => useEviTemplateStore.setState({ fields: parseTemplateFields(doc), loading: false }),
    () => useEviTemplateStore.setState({ loading: false }),
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  useEviTemplateStore.setState({ fields: [], loading: true });
}

hotReloadSubscribe('nyvia.evi-template', () => {
  const unsubAuth = auth.onAuthStateChanged((user) => (user ? start() : stop()));
  return () => {
    unsubAuth();
    stop();
  };
});
