import { Link, type Href } from 'expo-router';

import { Card } from '@/components/ui/card';
import { OfflineNotice } from '@/components/ui/offline-notice';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatRow } from '@/components/ui/stat-row';
import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';
import { CV_COLL_KEYS } from '../data/cv-repos';
import { useCvJobs } from '../data/cv-stores';
import { useCatalogueCounts } from '../hooks/use-catalogue';
import { COLL_LABEL } from '../labels';

/**
 * Katalogets forside: hvad ligger der, og hvor går man hen.
 *
 * Kataloget er sandheden — CV'et er et udtræk af det. Derfor er tallene her det man
 * vedligeholder, og genereringen ligger som en handling ved siden af, ikke omvendt.
 */
/**
 * ⚠️ `/cv/[coll]`, IKKE `/cv/[coll]/index`.
 *
 * `[coll]/index.tsx` svarer på `/cv/projekter` — præcis som `homes/[id]/index.tsx` linkes
 * til som `/homes/[id]`. Bruger man den lange form, bliver URL'en bogstaveligt
 * `/cv/projekter/index`, som rammer `[coll]/[id]`-ruten med id'et "index" og viser
 * "Posten findes ikke".
 *
 * Casten er nødvendig fordi `.expo/types/router.d.ts` for denne mappe er forældet og kun
 * kender den lange form (den indeholder også ikke-ruter som `/cv/render/render-doc`).
 * Casten kan fjernes når typegen er kørt igennem igen — den korte form dukker op af sig
 * selv, som den har gjort for `/homes/[id]`.
 */
const COLL_RUTE = '/cv/[coll]';

export function CvHubScreen() {
  // Tallene tælles på det man kan SE, så en slettet post forsvinder fra tallet samtidig
  // med at rækken forsvinder fra listen — ikke først når fortryd-vinduet lukker.
  const counts = useCatalogueCounts();
  const fromCache = useCvJobs((s) => s.fromCache);
  const total = CV_COLL_KEYS.reduce((n, k) => n + counts[k], 0);

  return (
    <Screen>
      <ScreenHeader title="CV" />

      <OfflineNotice fromCache={fromCache} />

      {/*
        Hver kollektion er sit eget link — tallet er både status og indgang.

        ⚠️ Stien er `/cv/[coll]`, IKKE `/cv/[coll]/index`. Den sidste typetjekker (typegen for
        denne mappe er forældet og mangler den korte form), men giver den bogstavelige URL
        `/cv/projekter/index` — som rammer `[coll]/[id]`-ruten med id'et "index" og viser
        "Posten findes ikke". Jf. `/homes/[id]/index.tsx`, der linkes til som `/homes/[id]`.
      */}
      <Card className="gap-0">
        {CV_COLL_KEYS.map((key) => (
          <Link
            key={key}
            href={{ pathname: COLL_RUTE, params: { coll: key } } as unknown as Href}
            asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${COLL_LABEL[key]}, ${counts[key]} poster`}
              className="border-b border-border py-2.5 last:border-b-0 active:opacity-60">
              <StatRow label={COLL_LABEL[key]}>{String(counts[key])}</StatRow>
            </Pressable>
          </Link>
        ))}
      </Card>

      {total === 0 ? (
        <View className="gap-2">
          <AppText variant="label">Kataloget er tomt</AppText>
          <AppText variant="muted" className="text-sm leading-relaxed">
            Har du allerede en `cv-data.json`, så indsæt den under Import og eksport. Ellers
            bygges kataloget op post for post.
          </AppText>
        </View>
      ) : null}

      <View className="gap-3 border-t border-border pt-4">
        <Link href="/cv/render" asChild>
          <Pressable accessibilityRole="button" hitSlop={6}>
            <AppText className="text-sm font-semibold text-primary">Lav et CV</AppText>
          </Pressable>
        </Link>
        <Link href="/cv/arkiv" asChild>
          <Pressable accessibilityRole="button" hitSlop={6}>
            <AppText className="text-sm font-semibold text-primary">Gemte ansøgninger</AppText>
          </Pressable>
        </Link>
        <Link href="/cv/settings" asChild>
          <Pressable accessibilityRole="button" hitSlop={6}>
            <AppText className="text-sm font-semibold text-primary">Stil og person</AppText>
          </Pressable>
        </Link>
        <Link href="/cv/io" asChild>
          <Pressable accessibilityRole="button" hitSlop={6}>
            <AppText className="text-sm font-semibold text-primary">Import og eksport</AppText>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
