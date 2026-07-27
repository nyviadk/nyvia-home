import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { notify } from '@/lib/toast/notify';
import { Pressable, TextInput, View } from '@/tw';
import { addFalsePositives, addLessons, addRaw } from '../data/planio.repository';
import { buildIntake, parseFindings, sharpenReference } from '../prompts';
import { spotConfig } from '../spots';
import type { PlanioLesson, PlanioRaw } from '../types';
import { CopyButton } from './copy-button';
import { ProdIdField, canonicalProdId } from './prod-id-field';
import { WeightBadge } from './weight-badge';

const textareaClass = 'rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg';

/** Split en indsat liste til enkelt-linjer, strip førende bullets/numre, drop tomme. */
const parseList = (raw: string): string[] =>
  raw
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•\d.)\]]+\s*/, '').trim())
    .filter(Boolean);

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

  const onProdNum = (num: string) => {
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

  // Preview: hvad parseren reelt finder i det indsatte — udledt under render (ingen state).
  const preview = parseFindings(analyzed);

  const fileAnalyzed = async () => {
    if (preview.length === 0) {
      notify("Kunne ikke finde 'Blind vinkel:' i teksten — tjek formatet");
      return;
    }
    setAnalyzed('');
    await addLessons(preview);
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
          <ProdIdField value={prodNum} onChangeText={onProdNum} />
          <View className="flex-1">
            <Input value={feature} onChangeText={setFeature} placeholder="Feature-navn" className="h-14" />
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

        {analyzed.trim() ? (
          preview.length ? (
            <View className="gap-2 rounded-lg bg-element px-3 py-2.5">
              <AppText variant="muted" className="text-[11px] uppercase">
                Preview · {preview.length} lektion(er) fundet
              </AppText>
              {preview.some((f) => sharpenReference(f.status) !== null) ? (
                <AppText variant="muted" className="text-xs">
                  ⟳ = skærper en eksisterende lektion — slet den gamle i Arkiv bagefter.
                </AppText>
              ) : null}
              {preview.map((f, i) => {
                const cfg = spotConfig(f.spot);
                const ref = sharpenReference(f.status);
                return (
                  <View key={i} className="border-l-2 pl-3" style={{ borderColor: cfg?.accent ?? '#ccc' }}>
                    <View className="flex-row items-center gap-2">
                      <AppText className="text-[11px]" style={{ color: cfg?.accent }}>
                        {cfg?.name ?? f.spot}
                      </AppText>
                      <WeightBadge weight={f.weight} />
                      {ref !== null ? (
                        <AppText className="text-[10px] text-accent-planio">⟳ skærper</AppText>
                      ) : null}
                    </View>
                    <AppText className="text-sm" numberOfLines={2}>
                      {f.lesson}
                    </AppText>
                    <AppText variant="muted" className="text-xs">
                      → {f.fix}
                    </AppText>
                    {ref ? (
                      <AppText className="text-[11px] text-accent-planio" numberOfLines={1}>
                        ⟳ skærper: {ref}
                      </AppText>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <AppText variant="muted" className="text-xs">
              Ingen FINDING fundet endnu — tjek formatet (Blind vinkel / Lektion / Klasse-fix / Vægt).
            </AppText>
          )
        ) : null}

        <View className="flex-row justify-end">
          <Button
            title={preview.length ? `Gem ${preview.length} lektion(er)` : 'Gem som lektion'}
            className="h-10 px-4"
            disabled={preview.length === 0}
            onPress={fileAnalyzed}
          />
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
