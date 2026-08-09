import { createDocStore } from '@/lib/db/doc-store';
import type { WithId } from '@/lib/firebase';
import type { EviField, EviTemplate } from '../types';
import { parseTemplateFields } from './evi.schema';
import { subscribeEviTemplate } from './evi-template.repository';

export const useEviTemplateStore = createDocStore<WithId<EviTemplate>, { fields: EviField[] }>({
  key: 'nyvia.evi-template',
  persistName: 'evi-template',
  subscribe: subscribeEviTemplate,
  empty: { fields: [] },
  map: (doc) => ({ fields: parseTemplateFields(doc) }),
});
