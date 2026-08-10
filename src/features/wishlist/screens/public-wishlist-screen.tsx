import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { THEME_HEX } from '@/constants/theme';
import type { WithId } from '@/lib/firebase';
import { confirmDelete } from '@/lib/undo/confirm-delete';
import { ActivityIndicator, Pressable, View } from '@/tw';
import { pendingExtraDeletes } from '../data/pending-deletes';
import { CardGrid } from '../components/card-grid';
import { CommentThread } from '../components/comment-thread';
import { PublicWishCard } from '../components/public-wish-card';
import { deleteExtra } from '../data/wishlist-public.repository';
import { usePublicWishlist } from '../hooks/use-public-wishlist';
import {
  namesLabel,
  type WishlistExtra,
} from '../types';

/** Overskrift + underoverskrift til en sektion — samme rytme hele vejen ned. */
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <View className="gap-3">
      <AppText className="text-3xl font-bold leading-tight text-fg">{title}</AppText>
      {sub ? (
        <AppText className="text-xl leading-relaxed text-fg" style={{ maxWidth: 560 }}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

/**
 * Offentlig ønskeliste (delelink). Gæster kan reservere, lægge penge (på en gave eller i en fælles
 * pulje), notere køb uden for listen og skrive kommentarer — alt uden login.
 *
 * Er den indloggede bruger ejeren, skjules ALT det gæsterne har lavet.
 */
export function PublicWishlistScreen({ ownerUid }: { ownerUid: string }) {
  const router = useRouter();
  const { wishes, extras, pot, comments, settings, loading, failed, isOwner, hideGuestInfo } =
    usePublicWishlist(ownerUid);
  const go = (
    pathname: '/w/[uid]/gift' | '/w/[uid]/extra',
    params: Record<string, string>,
  ) =>
    router.push({ pathname, params: { uid: ownerUid, ...params } });

  const onRemoveExtra = (extra: WithId<WishlistExtra>) =>
    void confirmDelete({
      title: 'Fjern fra listen',
      name: extra.text,
      message: `Fjern “${extra.text}”?`,
      confirmLabel: 'Fjern',
      toast: `“${extra.text}” fjernet`,
      markPending: () => pendingExtraDeletes.mark(extra.id),
      unmarkPending: () => pendingExtraDeletes.unmark(extra.id),
      remove: () => deleteExtra(ownerUid, extra.id),
    });

  if (failed) {
    return (
      <Screen>
        <EmptyState title="Kunne ikke hentes" description="Linket er måske forkert, eller listen er ikke delt." />
      </Screen>
    );
  }

  /**
   * Gæstens FØRSTE besøg har ingen cache, så der er en reel netværks-ventetid. Uden en
   * loader var siden tom bortset fra "Købt uden for listen" med tilføj-knappen — den lignede
   * en tom ønskeliste, ikke en der var på vej. Derfor skjules HELE gæste-indholdet imens,
   * ikke kun gave-grid'et. Ved genbesøg maler `useLiveCollection` fra cachen, og
   * `loading` er allerede false — så loaderen ses sjældent.
   */
  const stillLoading = loading && wishes.length === 0;

  const generalComments = comments.filter((c) => !c.wishId);

  return (
    <Screen className="max-w-300 gap-0 p-6">
      <View className="gap-3 pb-2 pt-4">
        <AppText className="text-4xl font-bold leading-tight text-fg">
          {settings?.title?.trim() || 'Ønskeliste'}
        </AppText>
        {isOwner ? (
          <AppText className="text-xl leading-relaxed text-fg">
            Det er din egen liste — alt hvad gæsterne laver er skjult for dig 🙈
          </AppText>
        ) : null}
      </View>

      <View className="h-10" />

      {stillLoading ? (
        <View className="items-center gap-4 py-24">
          <ActivityIndicator size="large" color={THEME_HEX.primary} />
          <AppText className="text-xl text-fg-muted">Henter gaver…</AppText>
        </View>
      ) : wishes.length === 0 ? (
        <EmptyState title="Ingen ønsker endnu" description="Listen er tom lige nu." />
      ) : (
        <CardGrid
          items={wishes}
          keyOf={(w) => w.id}
          gap={20}
          minColumnWidth={260}
          maxColumns={3}
          renderItem={(w) => (
            <PublicWishCard
              wish={w}
              hideGuestInfo={hideGuestInfo}
              contributions={pot.filter((c) => c.wishId === w.id)}
              commentCount={comments.filter((c) => c.wishId === w.id).length}
              onOpen={() => go('/w/[uid]/gift', { wishId: w.id })}
            />
          )}
        />
      )}

      {hideGuestInfo || stillLoading ? null : (
        <>
          {/* Købt uden for listen */}
          <View className="h-16" />
          <View className="border-t border-border pt-10">
            <SectionHead title="Købt uden for listen" sub="Gaver der ikke står på ønskelisten." />
            <View className="h-6" />
            {extras.length > 0 ? (
              <CardGrid
                items={extras}
                keyOf={(e) => e.id}
                gap={24}
                minColumnWidth={380}
                maxColumns={2}
                renderItem={(e) => (
                  <View
                    className="h-full gap-4 rounded-3xl border border-border bg-card p-6"
                    style={{ borderCurve: 'continuous' }}>
                    <AppText className="text-xl leading-relaxed text-fg">{e.text}</AppText>
                    <View className="flex-1" />
                    <View className="gap-1.5 rounded-2xl bg-element p-4" style={{ borderCurve: 'continuous' }}>
                      <AppText className="text-xl font-bold text-fg">
                        {namesLabel(e.by)}
                      </AppText>
                      <View className="flex-row gap-5">
                        <Pressable
                          accessibilityRole="button"
                          hitSlop={8}
                          onPress={() => go('/w/[uid]/extra', { id: e.id })}>
                          <AppText className="text-lg font-semibold text-primary">Redigér</AppText>
                        </Pressable>
                        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void onRemoveExtra(e)}>
                          <AppText className="text-lg font-semibold text-danger">Fjern</AppText>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              />
            ) : null}
            <View className="h-4" />
            <Pressable
              accessibilityRole="button"
              onPress={() => go('/w/[uid]/extra', {})}
              className="items-center rounded-2xl border-2 border-dashed border-primary py-5 active:bg-element"
              style={{ borderCurve: 'continuous' }}>
              <AppText className="text-xl font-bold text-primary">+ Tilføj noget du har købt</AppText>
            </Pressable>
          </View>

          {/* Generel tråd */}
          <View className="h-16" />
          <View className="border-t border-border pt-10">
            <SectionHead title="Kommentarer" sub="Snak sammen om gaverne." />
            <View className="h-6" />
            <View className="rounded-3xl bg-element p-5" style={{ borderCurve: 'continuous' }}>
              <CommentThread
                ownerUid={ownerUid}
                wishId={null}
                comments={generalComments}
              />
            </View>
          </View>
        </>
      )}

      <View className="h-16" />
    </Screen>
  );
}
