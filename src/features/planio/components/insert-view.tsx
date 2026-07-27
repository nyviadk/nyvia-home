import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { notify } from '@/lib/toast/notify';
import { TextInput, View } from '@/tw';
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

/** Feedback ind: rå (m. PROD-ID + feature) gemmes i arkiv; analyseret files sig selv; false
 *  positives fra Fase 1 gemmes globalt og injiceres i Pass 1. */
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
  const [prodId, setProdId] = useState('');
  const [feature, setFeature] = useState('');
  const [analyzed, setAnalyzed] = useState('');
  const [fpText, setFpText] = useState('');

  // Kendt feature pr. PROD-ID (nyeste vinder — raw er sorteret desc). Bruges til at auto-udfylde
  // feature-feltet, når man taster et PROD-ID der allerede findes (fx ved en ny feedback-runde).
  const featureByProdId = new Map<string, string>();
  for (const r of raw) {
    const pid = r.prodId?.trim().toLowerCase();
    const feat = r.feature?.trim();
    if (pid && feat && !featureByProdId.has(pid)) featureByProdId.set(pid, feat);
  }

  const onProdId = (next: string) => {
    setProdId(next);
    // Fyld kun hvis feature er tom, så manuelle rettelser ikke overskrives.
    if (!feature.trim()) {
      const known = featureByProdId.get(next.trim().toLowerCase());
      if (known) setFeature(known);
    }
  };

  const saveRaw = async () => {
    const t = rawText.trim();
    if (!t) return;
    setRawText('');
    setProdId('');
    setFeature('');
    await addRaw({ text: t, prodId, feature });
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
        <AppText variant="muted">Rå gemmes og er søgbar. Analyseret feedback filer sig selv.</AppText>
      </View>

      <Card className="gap-2">
        <AppText variant="label">Rå feedback (markdown)</AppText>
        <AppText variant="muted" className="text-xs">
          Gemmes og er søgbar. Fodrer ikke review-prompterne. PROD-ID + feature kobler den til en
          feature, så Fase 3 kan hente den (flere entries = flere runder).
        </AppText>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input value={prodId} onChangeText={onProdId} placeholder="PROD-ID (fx PROD-214)" />
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
          style={{ minHeight: 96, textAlignVertical: 'top' }}
        />
        <View className="flex-row justify-end">
          <Button title="Gem rå i arkiv" variant="secondary" className="h-10 px-4" onPress={saveRaw} />
        </View>
      </Card>

      <Card className="gap-2">
        <AppText variant="label">Analyseret feedback (fast format)</AppText>
        <AppText variant="muted" className="text-xs">
          Trin 1: kopiér format-prompten (den får hele arkivet + din rå feedback ovenfor med, så Claude
          dedupper mod eksisterende). Kør den i din Claude. Trin 2: indsæt det markdown, den giver, herunder.
        </AppText>
        <CopyButton text={buildIntake(rawText, lessons)} label="Kopiér format-prompt" />
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
