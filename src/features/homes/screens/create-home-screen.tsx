import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { HomeForm } from '../components/home-form';
import { createHome } from '../data/homes.repository';

export function CreateHomeScreen() {
  return (
    <Screen>
      <AppText variant="title">Ny bolig</AppText>
      <HomeForm
        submitLabel="Opret bolig"
        onSubmit={async (input) => {
          await createHome(input);
          router.back();
        }}
      />
    </Screen>
  );
}
