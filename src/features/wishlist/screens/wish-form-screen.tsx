import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { Pressable, View } from '@/tw';
import { WishForm } from '../components/wish-form';
import { createWish, deleteWish, updateWish } from '../data/wishlist.repository';
import { useWishlistStore } from '../data/wishlist-store';
import type { WishInput } from '../types';

/** Opret (uden id) eller redigér (med id) et ønske. */
export function WishFormScreen({ id }: { id?: string }) {
  const router = useRouter();
  const wish = useWishlistStore((s) => (id ? s.items.find((w) => w.id === id) : undefined));

  if (id && !wish) {
    return (
      <Screen>
        <EmptyState title="Ønsket findes ikke" description="Det er måske slettet." />
      </Screen>
    );
  }

  const onSubmit = async (input: WishInput) => {
    if (wish) await updateWish(wish.id, input);
    else await createWish(input);
    router.back();
  };

  const onDelete = async () => {
    if (!wish) return;
    if (await confirmAction('Slet ønske', `Slet "${wish.title}"?`, 'Slet')) {
      await deleteWish(wish.id);
      router.back();
    }
  };

  return (
    <Screen>
      <AppText variant="title">{wish ? 'Redigér ønske' : 'Nyt ønske'}</AppText>
      <WishForm initial={wish} submitLabel={wish ? 'Gem' : 'Tilføj ønske'} onSubmit={onSubmit} />
      {wish ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onDelete} className="self-center py-3">
          <AppText className="text-sm text-danger">Slet ønske</AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}
