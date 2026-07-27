import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { formatDateTimeCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Pressable, TextInput, View } from '@/tw';
import { deleteRaw, updateRaw } from '../data/planio.repository';
import type { PlanioRaw } from '../types';
import { MarkdownText } from './markdown-text';
import { ProdIdField, canonicalProdId, prodNumOf } from './prod-id-field';

const textareaClass = 'rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg';

/** Detalje for én rå feedback-entry: markdown-visning + rediger + slet. */
export function RawDetail({ raw, onBack }: { raw: WithId<PlanioRaw>; onBack: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(raw.text);
  const [prodNum, setProdNum] = useState(prodNumOf(raw.prodId));
  const [feature, setFeature] = useState(raw.feature ?? '');

  const startEdit = () => {
    setText(raw.text);
    setProdNum(prodNumOf(raw.prodId));
    setFeature(raw.feature ?? '');
    setEditing(true);
  };

  const save = async () => {
    if (!text.trim()) return;
    await updateRaw(raw.id, { text, prodId: canonicalProdId(prodNum), feature });
    setEditing(false);
  };

  const onDelete = async () => {
    if (await confirmAction('Slet', 'Fjern denne rå feedback fra arkivet?', 'Slet')) {
      await deleteRaw(raw.id);
      onBack();
    }
  };

  const meta = [raw.prodId, raw.feature].filter(Boolean).join(' · ') || raw.src;

  return (
    <View className="gap-3">
      <Pressable accessibilityRole="button" hitSlop={6} onPress={onBack}>
        <AppText variant="muted">‹ tilbage til arkiv</AppText>
      </Pressable>

      {editing ? (
        <Card className="gap-2">
          <View className="flex-row gap-2">
            <ProdIdField value={prodNum} onChangeText={setProdNum} />
            <View className="flex-1">
              <Input value={feature} onChangeText={setFeature} placeholder="Feature-navn" />
            </View>
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Rå feedback (markdown)…"
            className={textareaClass}
            style={{ minHeight: 180, textAlignVertical: 'top', fontFamily: 'monospace' }}
          />
          <View className="flex-row items-center gap-3">
            <Button title="Gem" className="h-10 px-4" onPress={save} />
            <Pressable accessibilityRole="button" hitSlop={6} onPress={() => setEditing(false)}>
              <AppText variant="muted">Annuller</AppText>
            </Pressable>
          </View>
        </Card>
      ) : (
        <Card className="gap-3">
          <View className="gap-0.5">
            {meta ? <AppText variant="label">{meta}</AppText> : null}
            <AppText variant="muted" className="text-[11px]">
              {formatDateTimeCopenhagen(raw.createdAt)}
            </AppText>
          </View>
          <MarkdownText value={raw.text} />
          <View className="flex-row items-center gap-3 border-t border-border pt-3">
            <Button title="Rediger" variant="secondary" className="h-10 px-4" onPress={startEdit} />
            <View className="flex-1" />
            <Pressable accessibilityRole="button" hitSlop={6} onPress={onDelete}>
              <AppText className="text-sm text-danger">Slet</AppText>
            </Pressable>
          </View>
        </Card>
      )}
    </View>
  );
}
