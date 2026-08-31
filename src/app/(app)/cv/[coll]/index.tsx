import { Redirect, useLocalSearchParams } from 'expo-router';

import { CatalogueListScreen } from '@/features/cv/screens/catalogue-list-screen';
import { isCvCollKey } from '@/features/cv/data/cv-repos';

export default function CatalogueListRoute() {
  const { coll } = useLocalSearchParams<{ coll: string }>();
  if (!isCvCollKey(coll)) return <Redirect href="/cv" />;
  return <CatalogueListScreen coll={coll} />;
}
