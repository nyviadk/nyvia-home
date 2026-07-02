import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { pickImages } from '@/lib/capture/pick-images';
import { formatDateCopenhagen } from '@/lib/datetime';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { useInspectionStore } from '../data/inspection-store';
import { saveInspectionEdit } from '../data/inspection.repository';
import type { InspectionItem, InspectionPhoto } from '../types';

type EditablePhoto = InspectionPhoto | { uri: string; takenAt?: string };

function uniqueNonEmpty(values: string[]): string[] {
  const map = new Map<string, string>();
  for (const v of values) {
    const t = v.trim();
    if (t && !map.has(t.toLowerCase())) map.set(t.toLowerCase(), t);
  }
  return Array.from(map.values());
}

export function EditInspectionScreen() {
  const { itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const items = useInspectionStore((s) => s.items);
  const item = items.find((i) => i.id === itemId);
  const roomSuggestions = uniqueNonEmpty(items.map((i) => i.room ?? ''));
  const titleSuggestions = uniqueNonEmpty(items.map((i) => i.title));

  if (!item) {
    return (
      <Screen>
        <AppText variant="muted">Indlæser…</AppText>
      </Screen>
    );
  }
  // key={item.id} → formularens state initialiseres fra posten uden useEffect.
  return (
    <EditForm
      key={item.id}
      item={item}
      roomSuggestions={roomSuggestions}
      titleSuggestions={titleSuggestions}
    />
  );
}

function EditForm({
  item,
  roomSuggestions,
  titleSuggestions,
}: {
  item: WithId<InspectionItem>;
  roomSuggestions: string[];
  titleSuggestions: string[];
}) {
  const [room, setRoom] = useState(item.room ?? '');
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [photos, setPhotos] = useState<EditablePhoto[]>(item.photos);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function onAdd() {
    const picked = await pickImages();
    if (picked.length > 0) {
      setPhotos((prev) => [...prev, ...picked.map((p) => ({ uri: p.uri, takenAt: p.takenAt }))]);
    }
  }
  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const canSave = title.trim().length > 0;

  async function onSave() {
    if (!canSave) return;
    setBusy(true);
    const newCount = photos.filter((p) => 'uri' in p).length;
    setProgress(newCount > 0 ? { done: 0, total: newCount } : null);
    try {
      await saveInspectionEdit(
        item,
        { room: room.trim() || undefined, title: title.trim(), notes: notes.trim() || undefined },
        photos,
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
      <AppText variant="title">Redigér syns-post</AppText>

      <FormField label="Rum (valgfri)">
        <AutocompleteInput
          value={room}
          onChange={setRoom}
          suggestions={roomSuggestions}
          placeholder="Fx Køkken"
        />
      </FormField>
      <FormField label="Beskrivelse">
        <AutocompleteInput
          value={title}
          onChange={setTitle}
          suggestions={titleSuggestions}
          placeholder="Fx Ridse i bordplade"
        />
      </FormField>
      <FormField label="Note (valgfri)">
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Uddyb evt. fejlen/manglen"
          multiline
          className="h-auto min-h-20 py-3"
          textAlignVertical="top"
        />
      </FormField>

      <Button title="Tilføj billeder" variant="secondary" onPress={onAdd} />
      {photos.length > 0 ? (
        <View className="gap-2">
          <AppText variant="muted">Tryk på et billede for at fjerne det.</AppText>
          <View className="flex-row flex-wrap gap-2">
            {photos.map((p, i) => (
              <Pressable
                key={'path' in p ? p.path : `${p.uri}-${i}`}
                accessibilityRole="button"
                onPress={() => removePhoto(i)}>
                <View style={{ width: 84 }} className="gap-0.5">
                  <Image
                    source={{ uri: 'url' in p ? p.url : p.uri }}
                    style={{ width: 84, height: 84, borderRadius: 8 }}
                    contentFit="cover"
                  />
                  {p.takenAt ? (
                    <AppText variant="muted" className="text-xs">
                      {formatDateCopenhagen(p.takenAt)}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {progress ? (
        <AppText variant="muted">
          Uploader… {progress.done} / {progress.total}
        </AppText>
      ) : null}

      <Button title="Gem ændringer" loading={busy} disabled={!canSave} onPress={onSave} />
    </Screen>
  );
}
