import { useState } from 'react';

import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { formatDateTimeCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Pressable, TextInput, View } from '@/tw';
import { setGuestName, useGuestStore } from '../data/guest-store';
import { addComment, deleteComment } from '../data/wishlist-public.repository';
import { namesLabel, type WishComment } from '../types';

/**
 * Chat-agtig kommentartråd. Bruges både til den generelle tråd (`wishId = null`) og til den
 * enkelte gave. Navnet tages fra `authorName` (den man sidst har skrevet som), så man ikke skal
 * taste det hver gang — er det tomt, står man som "Anonym".
 */
export function CommentThread({
  ownerUid,
  wishId,
  comments,
  compact,
}: {
  ownerUid: string;
  wishId: string | null;
  comments: WithId<WishComment>[];
  /** Mindre udgave til inde i et gavekort. */
  compact?: boolean;
}) {
  // Navnet ligger i en store, så det følger med på tværs af kort og skærme.
  const authorName = useGuestStore((g) => g.name);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setText('');
    try {
      await addComment(ownerUid, {
        by: authorName.trim() ? [authorName.trim()] : [],
        text: t,
        wishId,
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (await confirmAction('Slet kommentar', 'Kommentaren fjernes for alle.', 'Slet')) {
      await deleteComment(ownerUid, id);
    }
  };

  const bodyClass = compact ? 'text-lg' : 'text-xl';

  return (
    <View className="gap-3">
      {comments.length > 0 ? (
        <View className="gap-2.5">
          {comments.map((c) => (
            <View
              key={c.id}
              className="gap-1 rounded-2xl bg-card px-4 py-3"
              style={{ borderCurve: 'continuous' }}>
              <View className="flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
                <AppText className={`font-bold text-fg ${compact ? 'text-lg' : 'text-xl'}`}>
                  {namesLabel(c.by)}
                </AppText>
                <AppText className="text-base text-fg">{formatDateTimeCopenhagen(c.createdAt)}</AppText>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void remove(c.id)}>
                  <AppText className="text-base font-semibold text-danger">Slet</AppText>
                </Pressable>
              </View>
              <AppText className={`leading-relaxed text-fg ${bodyClass}`}>{c.text}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      {/* Alt i én kolonne: felt + knap ved siden af hinanden klemte begge dele på mobil. */}
      <View className="gap-2">
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Skriv en kommentar…"
          placeholderTextColor="#a8a29a"
          className={`w-full rounded-2xl border border-border bg-card px-4 py-3 text-fg ${bodyClass}`}
          style={{ minHeight: 72, textAlignVertical: 'top', borderCurve: 'continuous' }}
        />
        <View className="gap-1.5">
          <AppText className="text-base text-fg">Skriver som</AppText>
          <TextInput
            value={authorName}
            onChangeText={setGuestName}
            placeholder="Anonym"
            placeholderTextColor="#a8a29a"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-lg text-fg"
            style={{ borderCurve: 'continuous' }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!text.trim() || busy}
          onPress={send}
          className={`items-center rounded-2xl py-3.5 ${
            text.trim() ? 'bg-primary active:opacity-80' : 'bg-selected'
          }`}
          style={{ borderCurve: 'continuous' }}>
          <AppText className={`text-lg font-bold ${text.trim() ? 'text-on-primary' : 'text-fg-muted'}`}>
            Send kommentar
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
