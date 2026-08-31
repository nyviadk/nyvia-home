import { Redirect, useLocalSearchParams } from 'expo-router';

import { CatalogueEntryScreen } from '@/features/cv/screens/catalogue-entry-screen';
import { isCvCollKey } from '@/features/cv/data/cv-repos';

export default function CatalogueEntryRoute() {
  const { coll, id } = useLocalSearchParams<{ coll: string; id: string }>();
  if (!isCvCollKey(coll)) return <Redirect href="/cv" />;
  return <CatalogueEntryScreen coll={coll} id={id} />;
}
