import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { pickImages } from '@/lib/capture/pick-images';
import { Pressable, View } from '@/tw';
import { createInspectionItem } from '../data/inspection.repository';

export function CreateInspectionScreen() {
  const { id: homeId } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [uris, setUris] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function onPick() {
    const picked = await pickImages();
    if (picked.length > 0) setUris((prev) => [...prev, ...picked]);
  }

  const canSave = !!homeId && title.trim().length > 0 && uris.length > 0;

  async function onSave() {
    if (!canSave || !homeId) return;
    setBusy(true);
    setProgress({ done: 0, total: uris.length });
    try {
      await createInspectionItem(
        { homeId, title: title.trim(), room: room.trim(), notes: notes.trim() },
        uris,
        (done, total) => setProgress({ done, total })
      );
      router.back();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <Screen>
      <AppText variant="title">Ny syns-post</AppText>

      <FormField label="Rum (valgfri)">
        <Input value={room} onChangeText={setRoom} placeholder="Fx Køkken, Bad, Stue" />
      </FormField>
      <FormField label="Overskrift">
        <Input value={title} onChangeText={setTitle} placeholder="Fx Ridse i bordplade" />
      </FormField>
      <FormField label="Note (valgfri)">
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Beskriv fejlen/manglen"
          multiline
          className="h-auto min-h-20 py-3"
          textAlignVertical="top"
        />
      </FormField>

      <Button title="Vælg billeder fra kamerarullen" variant="secondary" onPress={onPick} />

      {uris.length > 0 ? (
        <View className="gap-2">
          <AppText variant="muted">{uris.length} billede(r) valgt</AppText>
          <View className="flex-row flex-wrap gap-2">
            {uris.map((uri, i) => (
              <Pressable
                key={`${uri}-${i}`}
                accessibilityRole="button"
                onPress={() => setUris((prev) => prev.filter((_, idx) => idx !== i))}>
                <Image
                  source={{ uri }}
                  style={{ width: 84, height: 84, borderRadius: 8 }}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </View>
          <AppText variant="muted">Tryk på et billede for at fjerne det.</AppText>
        </View>
      ) : null}

      {progress ? (
        <AppText variant="muted">
          Uploader… {progress.done} / {progress.total}
        </AppText>
      ) : null}

      <Button title="Gem syns-post" loading={busy} disabled={!canSave} onPress={onSave} />
    </Screen>
  );
}
