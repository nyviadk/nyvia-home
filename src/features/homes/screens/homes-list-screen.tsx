import { Link } from "expo-router";

import { Button } from "@/components/ui/button";
import { ListGate } from "@/components/ui/list-gate";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { AppText } from "@/components/ui/text";
import { View } from "@/tw";
import { HomeCard } from "../components/home-card";
import { useHomesStore } from "../data/homes-store";
import { withoutPending } from "@/lib/db/pending-deletes";
import { HOME_STATUSES } from "../types";

export function HomesListScreen() {
  const homes = useHomesStore.useVisibleItems();
  const loading = useHomesStore((s) => s.loading);
  const fromCache = useHomesStore((s) => s.fromCache);
  const pendingIds = useHomesStore.pending.useStore((s) => s.ids);

  const visible = withoutPending(homes, pendingIds);

  return (
    <Screen>
      <ScreenHeader title="Hjem" addHref="/homes/new" addLabel="Tilføj bolig" />

      {/* Globale flytte-værktøjer (ikke bundet til én bolig) */}
      <View className="flex-row gap-2">
        <Link href="/homes/tasks" asChild>
          <Button title="Flytte-todo" variant="secondary" className="h-10 flex-1" />
        </Link>
        <Link href="/homes/address-changes" asChild>
          <Button title="Adresseændringer" variant="secondary" className="h-10 flex-1" />
        </Link>
      </View>

      <OfflineNotice fromCache={fromCache} />

      <ListGate
        count={visible.length}
        loading={loading}
        empty={{
          title: 'Ingen boliger endnu',
          description:
            'Opret din nuværende eller kommende bolig for at samle flytning, adresseændringer og indflytningssyn ét sted.',
        }}>
        {HOME_STATUSES.map(({ value, label }) => {
          const group = visible.filter((h) => h.status === value);
          if (group.length === 0) return null;
          return (
            <View key={value} className="gap-2">
              <AppText variant="heading">{label}</AppText>
              {group.map((home) => (
                <HomeCard key={home.id} home={home} />
              ))}
            </View>
          );
        })}
      </ListGate>
    </Screen>
  );
}
