import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { notify } from '@/lib/toast/notify';
import { Pressable, TextInput, View } from '@/tw';
import { addFalsePositives, addLesson, addRaw } from '../data/planio.repository';
import { buildIntake, parseFinding } from '../prompts';
import type { PlanioLesson, PlanioRaw } from '../types';
import { CopyButton } from './copy-button';

const textareaClass = 'rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg';

/** Split en indsat liste til enkelt-linjer, strip førende bullets/numre, drop tomme. */
const parseList = (raw: string): string[] =>
  raw
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•\d.)\]]+\s*/, '').trim())
    .filter(Boolean);

/** Kanonisk PROD-ID af det tal man taster: "214" → "PROD-214". Tomt → "". */
const canonicalProdId = (num: string): string => {
  const n = num.trim();
  return n ? `PROD-${n}` : '';
};

/**
 * Feedback ind. Rå-feltet fodrer BÅDE arkivet (gem → Fase 3) OG format-prompten (analysér →
 * lektion) — derfor rydder "gem" IKKE feltet; brug "Ryd" når du er færdig. Analysér-kortet
 * tager kun Claudes FINDING-svar. False positives gemmes globalt + injiceres i Pass 1.
 */
export function InsertView({
  lessons,
  raw,
  existingFalsePositives,
}: {
  lessons: WithId<PlanioLesson>[];
  raw: WithId<PlanioRaw>[];
  existingFalsePositives: string[];
}) {
  const [rawText, setRawText] = useState('');
  // Kun tallet; "PROD-" er et fast præfiks i feltet. Gemmes som canonicalProdId(prodNum).
  const [prodNum, setProdNum] = useState('');
  const [feature, setFeature] = useState('');
  const [analyzed, setAnalyzed] = useState('');
  const [fpText, setFpText] = useState('');

  const prodId = canonicalProdId(prodNum);

  // Kendt feature pr. PROD-ID (nyeste vinder — raw er sorteret desc). Auto-udfylder feature-feltet,
  // når man taster et PROD-ID der allerede findes (fx ved en ny feedback-runde).
  const featureByProdId = new Map<string, string>();
  for (const r of raw) {
    const pid = r.prodId?.trim().toLowerCase();
    const feat = r.feature?.trim();
    if (pid && feat && !featureByProdId.has(pid)) featureByProdId.set(pid, feat);
  }

  const onProdNum = (next: string) => {
    // Strip et evt. indsat "PROD-"-præfiks, så vi ikke ender med "PROD-PROD-214".
    const num = next.replace(/^\s*prod[-\s]*/i, '');
    setProdNum(num);
    if (!feature.trim()) {
      const known = featureByProdId.get(canonicalProdId(num).toLowerCase());
      if (known) setFeature(known);
    }
  };

  const clearRaw = () => {
    setRawText('');
    setProdNum('');
    setFeature('');
  };

  const saveRaw = async () => {
    if (!rawText.trim()) return;
    // Bevidst INGEN rydning — samme tekst bruges også til format-prompten nedenfor.
    await addRaw({ text: rawText, prodId, feature });
  };

  const fileAnalyzed = async () => {
    const parsed = parseFinding(analyzed);
    if (!parsed) {
      notify("Kunne ikke finde 'Blind vinkel:' i teksten — tjek formatet");
      return;
    }
    setAnalyzed('');
    await addLesson(parsed);
  };

  const saveFalsePositives = async () => {
    const texts = parseList(fpText);
    if (texts.length === 0) return;
    setFpText('');
    const added = await addFalsePositives(texts, existingFalsePositives);
    if (added === 0) notify('Ingen nye — alle var allerede gemt');
  };

  return (
    <View className="gap-4">
      <View className="gap-1">
        <AppText variant="heading">Indsæt</AppText>
        <AppText variant="muted">Rå feedback fodrer både arkivet og analyse-prompten.</AppText>
      </View>

      <Card className="gap-2">
        <AppText variant="label">Rå feedback (markdown)</AppText>
        <AppText variant="muted" className="text-xs">
          Samme tekst bruges to steder: <AppText className="text-xs text-fg">Gem i arkiv</AppText> (så Fase 3
          kan hente den via PROD-ID + feature — flere gem = flere runder) og{' '}
          <AppText className="text-xs text-fg">Kopiér format-prompt</AppText> (analysér den til en lektion).
          Feltet ryddes ikke af sig selv — tryk “Ryd” når du er færdig.
        </AppText>
        <View className="flex-row gap-2">
          <View
            className="h-12 flex-1 flex-row items-center gap-1 rounded-xl border border-border bg-card px-4"
            style={{ borderCurve: 'continuous' }}>
            <AppText variant="muted">PROD-</AppText>
            <TextInput
              value={prodNum}
              onChangeText={onProdNum}
              placeholder="214"
              placeholderTextColor="#a8a29a"
              className="flex-1 text-base text-fg"
              style={{ paddingVertical: 0 }}
            />
          </View>
          <View className="flex-1">
            <Input value={feature} onChangeText={setFeature} placeholder="Feature-navn" />
          </View>
        </View>
        <TextInput
          value={rawText}
          onChangeText={setRawText}
          multiline
          placeholder="Indsæt rå feedback (fx mentorens kommentarer)…"
          className={textareaClass}
          style={{ minHeight: 112, textAlignVertical: 'top' }}
        />
        <View className="flex-row items-center gap-3">
          <Button title="Gem i arkiv" variant="secondary" className="h-10 px-4" onPress={saveRaw} />
          <CopyButton text={buildIntake(rawText, lessons)} label="Kopiér format-prompt" />
          <View className="flex-1" />
          {rawText.trim() || prodNum.trim() || feature.trim() ? (
            <Pressable accessibilityRole="button" hitSlop={6} onPress={clearRaw}>
              <AppText variant="muted">Ryd</AppText>
            </Pressable>
          ) : null}
        </View>
      </Card>

      <Card className="gap-2">
        <AppText variant="label">FINDING → lektion</AppText>
        <AppText variant="muted" className="text-xs">
          Kør format-prompten i din Claude (den dedupper mod arkivet og tagger selv). Indsæt det
          FINDING-markdown, den giver, herunder → gem som lektion.
        </AppText>
        <TextInput
          value={analyzed}
          onChangeText={setAnalyzed}
          multiline
          placeholder={'Indsæt Claudes FINDING-markdown…\n- Blind vinkel: async\n- Lektion: …\n- Klasse-fix: …\n- Vægt: kritisk'}
          className={textareaClass}
          style={{ minHeight: 128, fontFamily: 'monospace', textAlignVertical: 'top' }}
        />
        <View className="flex-row justify-end">
          <Button title="Gem som lektion" className="h-10 px-4" onPress={fileAnalyzed} />
        </View>
      </Card>

      <Card className="gap-2">
        <AppText variant="label">False positives (Fallow)</AppText>
        <AppText variant="muted" className="text-xs">
          Indsæt false-positives-listen fra Fase 1's output (én pr. linje). Gemmes globalt og injiceres i
          Pass 1, så Claude springer dem over og ikke gen-verificerer dem hver gang. Dubletter filtreres fra.
        </AppText>
        <TextInput
          value={fpText}
          onChangeText={setFpText}
          multiline
          placeholder={'Indsæt false positives…\n- registerBlock brugt via string-ref i router\n- useX flagget dødt men kaldt af framework'}
          className={textareaClass}
          style={{ minHeight: 96, fontFamily: 'monospace', textAlignVertical: 'top' }}
        />
        <View className="flex-row justify-end">
          <Button title="Gem false positives" variant="secondary" className="h-10 px-4" onPress={saveFalsePositives} />
        </View>
      </Card>
    </View>
  );
}
