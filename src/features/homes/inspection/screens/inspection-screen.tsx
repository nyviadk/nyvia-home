import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { updateHomeReportInfo } from '../../data/homes.repository';
import { useHomesStore } from '../../data/homes-store';
import type { Home } from '../../types';
import { InspectionItemCard } from '../components/inspection-item-card';
import { useInspectionStore } from '../data/inspection-store';
import { exportInspectionPdf } from '../data/inspection.export';
import type { InspectionItem } from '../types';

export function InspectionScreen() {
  const { id: homeId } = useLocalSearchParams<{ id: string }>();
  const home = useHomesStore((s) => s.items.find((h) => h.id === homeId));
  const items = useInspectionStore((s) => s.items).filter((i) => i.homeId === homeId);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <AppText variant="title">Indflytningssyn</AppText>
          {home ? <AppText variant="muted">{home.address}</AppText> : null}
        </View>
        <Link href={{ pathname: '/homes/[id]/inspection/new', params: { id: homeId ?? '' } }} asChild>
          <Button title="Tilføj" className="h-10 px-4" />
        </Link>
      </View>

      {items.length > 0 && home ? <ExportSection key={home.id} home={home} items={items} /> : null}

      {items.length === 0 ? (
        <EmptyState
          title="Ingen poster endnu"
          description="Tilføj fejl/mangler med billeder (vælg flere fra kamerarullen) og skriv en beskrivelse ved hvert, så du har dokumentation til udlejer."
        />
      ) : (
        <View className="gap-2">
          {items.map((item) => (
            <InspectionItemCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </Screen>
  );
}

/** key={home.id} → extraInfo initialiseres fra boligen uden useEffect. Gemmes ved blur + eksport. */
function ExportSection({ home, items }: { home: WithId<Home>; items: WithId<InspectionItem>[] }) {
  const [extraInfo, setExtraInfo] = useState(home.reportInfo ?? '');
  const [exporting, setExporting] = useState(false);

  const saveInfo = () => {
    const v = extraInfo.trim();
    if ((home.reportInfo ?? '') !== v) void updateHomeReportInfo(home.id, v);
  };
  async function onExport() {
    saveInfo();
    setExporting(true);
    try {
      await exportInspectionPdf(home.address, items, extraInfo);
    } finally {
      setExporting(false);
    }
  }

  return (
    <View className="gap-2">
      <FormField label="Ekstra info til PDF (valgfri)">
        <Input
          value={extraInfo}
          onChangeText={setExtraInfo}
          onBlur={saveInfo}
          placeholder={'Fx dit navn, indflytningsdato, lejemål…'}
          multiline
          className="h-auto min-h-20 py-3"
          textAlignVertical="top"
        />
      </FormField>
      <Button
        title="Eksportér som PDF"
        variant="secondary"
        loading={exporting}
        onPress={onExport}
      />
    </View>
  );
}
