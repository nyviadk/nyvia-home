import { router } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { FoodForm } from '../components/food-form';
import { createFood, deleteFood, updateFood } from '../data/protein.repository';
import { useFoodsStore } from '../data/protein-stores';
import type { ProteinFoodInput } from '../types';

export function CreateFoodScreen() {
  const submit = async (input: ProteinFoodInput) => {
    await createFood(input);
    router.back();
  };
  return (
    <Screen>
      <AppText variant="title">Ny ret</AppText>
      <FoodForm submitLabel="Gem ret" onSubmit={submit} />
    </Screen>
  );
}

export function EditFoodScreen({ id }: { id: string }) {
  const { item, loading } = useFoodsStore.useItem(id);

  if (!item) {
    return loading ? (
      <LoadingScreen />
    ) : (
      <Screen>
        <AppText variant="muted">Retten findes ikke længere.</AppText>
      </Screen>
    );
  }

  const submit = async (input: ProteinFoodInput) => {
    await updateFood(id, input);
    router.back();
  };

  return (
    <Screen>
      <AppText variant="title">Redigér ret</AppText>
      {/* Retten kan være logget mange gange. Posterne i logbogen har deres egne tal-kopier,
          så de rører sig ikke — historikken må ikke skrive sig selv om bagud. */}
      <FoodForm food={item} submitLabel="Gem" onSubmit={submit} />
      <DeleteEntityLink
        id={id}
        label="Slet ret"
        name={item.name}
        pending={useFoodsStore.pending}
        remove={() => deleteFood(id)}
      />
    </Screen>
  );
}
