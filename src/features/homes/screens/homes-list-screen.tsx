import { Link } from "expo-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { View } from "@/tw";
import { HomeCard } from "../components/home-card";
import { useHomesStore } from "../data/homes-store";
import { usePendingHomeDeletes } from "../data/pending-deletes";
import { HOME_STATUSES } from "../types";

export function HomesListScreen() {
  const homes = useHomesStore((s) => s.items);
  const loading = useHomesStore((s) => s.loading);
  const fromCache = useHomesStore((s) => s.fromCache);
  const pendingIds = usePendingHomeDeletes((s) => s.ids);

  const visible = homes.filter((h) => !pendingIds.has(h.id));

  return (
    <Screen>
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="title">Hjem</AppText>
        <View className="flex-row items-center gap-2">
          <Link href="/homes/address-changes" asChild>
            <Button title="Adresseændringer" variant="secondary" className="h-10 px-4" />
          </Link>
          <Link href="/homes/new" asChild>
            <Button title="Tilføj bolig" className="h-10 px-4" />
          </Link>
        </View>
      </View>

      {fromCache ? (
        <AppText variant="muted">Offline – viser gemte data</AppText>
      ) : null}

      {visible.length === 0 ? (
        loading ? null : (
          <EmptyState
            title="Ingen boliger endnu"
            description="Opret din nuværende eller kommende bolig for at samle flytning, adresseændringer og indflytningssyn ét sted."
          />
        )
      ) : (
        HOME_STATUSES.map(({ value, label }) => {
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
        })
      )}
    </Screen>
  );
}
