import { Link, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { formatDateCopenhagen } from '@/lib/datetime';
import { Pressable, View } from '@/tw';
import { CopyableRow } from '@/components/ui/copyable-row';
import { useHomesStore } from '../data/homes-store';
import { type Landlord, homeLocation } from '../types';

export function HomeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const home = useHomesStore((s) => s.items.find((h) => h.id === id));

  if (!home) {
    return (
      <Screen>
        <EmptyState title="Bolig ikke fundet" description="Den er måske slettet." />
      </Screen>
    );
  }

  const location = homeLocation(home);
  const dates = [
    home.moveInDate ? `Ind ${formatDateCopenhagen(home.moveInDate)}` : null,
    home.moveOutDate ? `Ud ${formatDateCopenhagen(home.moveOutDate)}` : null,
  ].filter(Boolean);
  const l = home.landlord;

  return (
    <Screen>
      <View className="gap-0.5">
        <AppText variant="title">{home.address}</AppText>
        {location ? <AppText variant="muted">{location}</AppText> : null}
        {dates.length > 0 ? <AppText variant="muted">{dates.join(' · ')}</AppText> : null}
      </View>

      <View className="gap-2">
        <SectionLink
          title="Indflytningssyn"
          subtitle="Fotos af fejl & mangler pr. rum"
          href={{ pathname: '/homes/[id]/inspection', params: { id: home.id } }}
        />
      </View>

      {l && hasLandlord(l) ? (
        <Card className="gap-2">
          <AppText variant="label">Udlejer</AppText>
          {l.name ? <CopyableRow label="Navn" value={l.name} /> : null}
          {l.phone ? <CopyableRow label="Telefon" value={l.phone} /> : null}
          {l.email ? <CopyableRow label="E-mail" value={l.email} /> : null}
          {l.regNo ? <CopyableRow label="Reg.nr." value={l.regNo} /> : null}
          {l.accountNo ? <CopyableRow label="Kontonr." value={l.accountNo} /> : null}
          {l.address ? <CopyableRow label="Adresse" value={l.address} /> : null}
          {l.notes ? <AppText variant="muted">{l.notes}</AppText> : null}
        </Card>
      ) : null}

      <Link href={{ pathname: '/homes/[id]/edit', params: { id: home.id } }} asChild>
        <Pressable
          accessibilityRole="button"
          className="items-center rounded-2xl border border-border bg-card p-3 hover:bg-element">
          <AppText className="text-primary">Redigér bolig</AppText>
        </Pressable>
      </Link>
    </Screen>
  );
}

function hasLandlord(l: Landlord): boolean {
  return Object.values(l).some(Boolean);
}

function SectionLink({ title, subtitle, href }: { title: string; subtitle: string; href: Href }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button">
        <Card className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <AppText variant="label">{title}</AppText>
            <AppText variant="muted">{subtitle}</AppText>
          </View>
          <AppText variant="muted">›</AppText>
        </Card>
      </Pressable>
    </Link>
  );
}
