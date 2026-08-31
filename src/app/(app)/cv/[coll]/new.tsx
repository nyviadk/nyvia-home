import { Redirect, useLocalSearchParams } from 'expo-router';

import { CatalogueEntryScreen } from '@/features/cv/screens/catalogue-entry-screen';
import { isCvCollKey } from '@/features/cv/data/cv-repos';

export default function CatalogueNewRoute() {
  const { coll } = useLocalSearchParams<{ coll: string }>();
  if (!isCvCollKey(coll)) return <Redirect href="/cv" />;
  return <CatalogueEntryScreen coll={coll} />;
}
