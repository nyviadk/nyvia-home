import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { pickImages } from '@/lib/capture/pick-images';
import { formatDateCopenhagen } from '@/lib/datetime';
import { Pressable, Text, View } from '@/tw';
import { useInspectionStore } from '../data/inspection-store';
import { createInspectionGroups } from '../data/inspection.repository';

type Row = { uri: string; takenAt?: string; room: string; title: string };
type Group = { room?: string; title: string; photos: { uri: string; takenAt?: string }[] };

/** Unikke, ikke-tomme strenge (case-insensitivt; første stavemåde bevares). */
function uniqueNonEmpty(values: string[]): string[] {
  const map = new Map<string, string>();
  for (const v of values) {
    const t = v.trim();
    if (t && !map.has(t.toLowerCase())) map.set(t.toLowerCase(), t);
  }
  return Array.from(map.values());
}

export function CreateInspectionScreen() {
  const { id: homeId } = useLocalSearchParams<{ id: string }>();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const items = useInspectionStore((s) => s.items);
  // Forslag = tidligere GEMTE tekster + det du allerede har skrevet i DENNE omgang. Udledt
  // under render fra den stabile items-reference (ny array fra selector = uendelig loop).
  const roomSuggestions = uniqueNonEmpty([...items.map((i) => i.room ?? ''), ...rows.map((r) => r.room)]);
  const titleSuggestions = uniqueNonEmpty([...items.map((i) => i.title), ...rows.map((r) => r.title)]);

  async function onPick() {
    const picked = await pickImages();
    if (picked.length > 0) {
      setRows((prev) => [...prev, ...picked.map((p) => ({ uri: p.uri, takenAt: p.takenAt, room: '', title: '' }))]);
    }
  }
  const patch = (i: number, p: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  // Gruppér billeder med samme rum + note → én post pr. gruppe (samles med eksisterende ved gem).
  const groups: Group[] = Array.from(
    rows
      .reduce((map, r) => {
        const title = r.title.trim();
        if (!title) return map;
        const room = r.room.trim();
        const key = `${room.toLowerCase()}|${title.toLowerCase()}`;
        const photo = { uri: r.uri, takenAt: r.takenAt };
        const g = map.get(key);
        if (g) g.photos.push(photo);
        else map.set(key, { room: room || undefined, title, photos: [photo] });
        return map;
      }, new Map<string, Group>())
      .values()
  );

  const canSave = !!homeId && groups.length > 0;

  async function onSave() {
    if (!canSave || !homeId) return;
    setBusy(true);
    setProgress({ done: 0, total: rows.filter((r) => r.title.trim()).length });
    try {
      await createInspectionGroups(homeId, groups, items, (done, total) => setProgress({ done, total }));
      router.back();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <Screen>
      <AppText variant="title">Tilføj syns-poster</AppText>
      <AppText variant="muted">
        Vælg billeder og skriv rum + beskrivelse ved hvert. Billeder med samme rum og beskrivelse
        samles til én post — også på tværs af omgange. Tidligere tekster foreslås.
      </AppText>

      <Button title="Vælg billeder fra kamerarullen" variant="secondary" onPress={onPick} />

      {rows.length > 0 ? (
        <View className="gap-3">
          {rows.map((r, i) => (
            <View key={`${r.uri}-${i}`} className="flex-row items-start gap-3">
              <View style={{ width: 72 }} className="gap-0.5">
                <Image
                  source={{ uri: r.uri }}
                  style={{ width: 72, height: 72, borderRadius: 8 }}
                  contentFit="cover"
                />
                {r.takenAt ? (
                  <AppText variant="muted" className="text-xs">
                    {formatDateCopenhagen(r.takenAt)}
                  </AppText>
                ) : null}
              </View>
              <View className="flex-1 gap-2">
                <AutocompleteInput
                  value={r.room}
                  onChange={(room) => patch(i, { room })}
                  suggestions={roomSuggestions}
                  placeholder="Rum (fx Køkken)"
                />
                <AutocompleteInput
                  value={r.title}
                  onChange={(title) => patch(i, { title })}
                  suggestions={titleSuggestions}
                  placeholder="Beskrivelse (fx Ridse i bordplade)"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => removeRow(i)}
                hitSlop={8}
                className="px-1 pt-2">
                <Text className="text-sm text-danger">Fjern</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {groups.length > 0 ? (
        <View className="gap-1 rounded-xl border border-border bg-element p-3">
          <AppText variant="label">Samles som {groups.length} post(er):</AppText>
          {groups.map((g, i) => (
            <AppText key={i} variant="muted">
              • {g.room ? `${g.room} · ` : ''}
              {g.title} — {g.photos.length} billede(r)
            </AppText>
          ))}
        </View>
      ) : null}

      {progress ? (
        <AppText variant="muted">
          Uploader… {progress.done} / {progress.total}
        </AppText>
      ) : null}

      <Button
        title={groups.length > 0 ? `Gem ${groups.length} post(er)` : 'Gem'}
        loading={busy}
        disabled={!canSave}
        onPress={onSave}
      />
    </Screen>
  );
}
