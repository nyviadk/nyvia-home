import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { DeleteHomeLink } from '../components/delete-home-link';
import { HomeForm } from '../components/home-form';
import { useHomesStore } from '../data/homes-store';
import { updateHome } from '../data/homes.repository';

export function EditHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const home = useHomesStore((s) => s.items.find((h) => h.id === id));

  if (!home) {
    return (
      <Screen>
        <EmptyState title="Bolig ikke fundet" description="Den er måske slettet." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Redigér bolig</AppText>
      <HomeForm
        home={home}
        submitLabel="Gem"
        onSubmit={async (input) => {
          await updateHome(home.id, input);
          router.back();
        }}
      />
      <DeleteHomeLink id={home.id} label={home.address} />
    </Screen>
  );
}
