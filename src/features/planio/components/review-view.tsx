import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { View } from '@/tw';
import { buildPass1, buildPass2, buildRuleCheck, curated } from '../prompts';
import { SPOTS } from '../spots';
import type { PlanioLesson } from '../types';
import { PromptCard } from './prompt-card';

/**
 * Review-kernen. Scope er PÅKRÆVET — kopiér er spærret indtil feltet er udfyldt (ellers ramte
 * reviewet hele kodebasen). Scope lever kun her; forlader man Review (skift fane/søgning),
 * unmountes view'et → scope ryddes, så alle tre prompts altid deler samme scope.
 */
export function ReviewView({
  lessons,
  falsePositives,
}: {
  lessons: WithId<PlanioLesson>[];
  falsePositives: string[];
}) {
  const [scope, setScope] = useState('');
  const has = scope.trim().length > 0;
  const inject = (t: string) => t.replace('{{SCOPE}}', has ? scope.trim() : '[udfyld scope-feltet ovenfor]');

  return (
    <View className="gap-4">
      <View className="gap-1">
        <AppText variant="heading">Review</AppText>
        <AppText variant="muted">
          Tjek ucommitteret før hvert commit. Ved et større stykke arbejde: Pass 1 → ret → Pass 2
          → ret → send til mentor. Kopiér til den Claude, der har din kode.
        </AppText>
      </View>

      <Card className="gap-1.5" style={{ borderColor: has ? undefined : '#fca5a5' }}>
        <View className="flex-row items-center gap-1">
          <AppText variant="muted" className="text-[11px] uppercase">
            Scope
          </AppText>
          <AppText className="text-[11px] text-danger">· påkrævet</AppText>
        </View>
        <Input
          value={scope}
          onChangeText={setScope}
          invalid={!has}
          placeholder="fx: functions/googleCalendar/* — eller 'Google Calendar sync-flowet'"
        />
        <AppText variant="muted" className="text-xs">
          Uden scope ville reviewet ramme hele kodebasen — derfor er kopiér spærret, til feltet er
          udfyldt. Ryddes, når du forlader Review (så alle tre prompts deler samme scope).
        </AppText>
      </Card>

      {/*
        Står FØRST, fordi den er den man kører oftest — de to andre er hele reviews.
        Og den ENESTE med `canCopy` uden scope: tomt felt betyder "mine ucommitterede
        ændringer", som er det almindelige tilfælde. Spærrede vi den bag scope-feltet,
        ville man skulle skrive et område for at spørge "holder det jeg lige har lavet?".
      */}
      <PromptCard
        title="Tjek mod alle regler"
        sub="Én linje til den Claude der har koden · uden scope: dine ucommitterede ændringer"
        prompt={buildRuleCheck(scope)}
      />
      <PromptCard
        title="Pass 1 · Kvalitet / refactor"
        sub={`Din fulde staff-prompt · kør FØRST (den flytter kode)${
          falsePositives.length ? ` · springer ${falsePositives.length} kendte false positives over` : ''
        }`}
        prompt={inject(buildPass1(falsePositives))}
        canCopy={has}
      />
      <PromptCard
        title="Pass 2 · Blind-vinkel-sweep"
        sub="Samlet af dine rigtige lektioner (kritisk + tilbagevendende)"
        prompt={inject(buildPass2(lessons))}
        canCopy={has}
        chips={SPOTS.map((s) => ({
          id: s.id,
          name: s.name,
          n: curated(lessons, s.id).length,
          bg: s.bg,
          accent: s.accent,
        }))}
      />
    </View>
  );
}
