import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { createSpanishEntries } from '../data/spanish.repository';
import { useSpanishStore } from '../data/spanish-store';
import { dedupeKey, parseEntries } from '../import-parse';
import { SPANISH_KINDS, type SpanishKind } from '../types';

const EXAMPLE = `Hola (o-la) – Hej
¿Qué tal? (ke tal) – Hvordan går det?
Gracias – Tak`;

/**
 * Indsæt en hel gloseliste på én gang.
 *
 * Formularen én-ad-gangen er fin til den enkelte glose man samler op undervejs, men
 * ubrugelig til de tyve man har stående i en note. Formatet her er det man i forvejen
 * skriver: spansk, udtale i parentes, tankestreg, dansk.
 */
export function SpanishImportScreen() {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<SpanishKind>('ord');
  const [saving, setSaving] = useState(false);

  /**
   * Dubletkontrol kræver ALLE poster, også dem der ligger i et åbent fortryd-vindue: en
   * post man lige har slettet må ikke pludselig kunne indsættes igen som "ny" og støde
   * sammen med den, hvis man fortryder sletningen. Derfor `useAllItems` og ikke
   * `useVisibleItems` — jf. reglen i AGENTS.md.
   */
  const existing = useSpanishStore.useAllItems();

  // Udledt under render — ingen state, ingen effect. Parsningen er ren og billig.
  const { entries, skipped } = parseEntries(text);
  const knownEs = new Set(existing.map((e) => dedupeKey(e.es)));
  const knownDa = new Set(existing.map((e) => dedupeKey(e.da)));

  const seenEs = new Set<string>();
  const seenDa = new Set<string>();
  const rows = entries.map((entry) => {
    const esKey = dedupeKey(entry.es);
    const daKey = dedupeKey(entry.da);
    // Både mod det der allerede er gemt OG mod tidligere linjer i selve indsættelsen —
    // en liste man har klistret sammen af to noter har typisk gengangere i sig.
    const duplicate = knownEs.has(esKey) || seenEs.has(esKey);
    /**
     * To poster med samme DANSKE side er ikke en dublet — det er et kort der ikke kan
     * besvares. I retningen dansk→spansk får man det samme spørgsmål for to forskellige
     * facitter, så det ene svar bliver altid bedømt forkert uanset hvad man skriver.
     * Det advares der om frem for at blokere: nogle gange ER to spanske vendinger den
     * samme danske, og så er det ens eget valg at leve med det.
     */
    const ambiguous = !duplicate && (knownDa.has(daKey) || seenDa.has(daKey));
    seenEs.add(esKey);
    seenDa.add(daKey);
    return { ...entry, duplicate, ambiguous };
  });

  const fresh = rows.filter((r) => !r.duplicate);
  const duplicates = rows.length - fresh.length;
  const ambiguous = rows.filter((r) => r.ambiguous).length;

  const save = async () => {
    if (fresh.length === 0) return;
    setSaving(true);
    try {
      await createSpanishEntries(fresh.map(({ es, da, pron }) => ({ kind, es, da, pron })));
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Indsæt liste</AppText>

      <View className="gap-2">
        <AppText variant="label">Format</AppText>
        <View className="rounded-xl bg-element p-3">
          <AppText variant="muted" className="text-sm" style={{ fontFamily: 'monospace' }}>
            {EXAMPLE}
          </AppText>
        </View>
        <AppText variant="muted" className="text-xs">
          Én pr. linje: spansk, udtale i parentes, tankestreg, dansk. Udtalen må gerne
          udelades. Nummerering og punkttegn foran linjen fjernes automatisk.
        </AppText>
      </View>

      <View className="gap-2">
        <AppText variant="label">Type</AppText>
        <Segmented<SpanishKind> value={kind} options={SPANISH_KINDS} onChange={setKind} />
      </View>

      <Input
        value={text}
        onChangeText={setText}
        placeholder="Indsæt din liste her…"
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        className="h-64 py-3"
        style={{ textAlignVertical: 'top' }}
      />

      {text.trim() ? (
        <Card className="gap-3">
          <AppText variant="label">
            {fresh.length} {fresh.length === 1 ? 'post' : 'poster'} klar
            {duplicates > 0 ? ` · ${duplicates} findes allerede` : ''}
            {ambiguous > 0 ? ` · ${ambiguous} med samme danske side` : ''}
          </AppText>

          {rows.length > 0 ? (
            <View className="gap-2">
              {rows.map((row, i) => (
                <View
                  key={`${row.es}:${i}`}
                  className={row.duplicate ? 'gap-0.5 opacity-40' : 'gap-0.5'}>
                  <AppText variant="label" className="text-sm">
                    {row.es}
                    {row.duplicate ? ' — findes allerede' : ''}
                  </AppText>
                  {row.ambiguous ? (
                    <AppText className="text-xs text-warning">
                      ⚠ Samme danske side som en anden post — kan ikke besvares i dansk → spansk
                    </AppText>
                  ) : null}
                  <AppText variant="muted" className="text-xs">
                    {row.pron ? `${row.pron} · ` : ''}
                    {row.da}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {skipped.length > 0 ? (
            <View className="gap-1 border-t border-border pt-3">
              <AppText variant="label" className="text-sm text-danger">
                {skipped.length} {skipped.length === 1 ? 'linje' : 'linjer'} springes over
              </AppText>
              {/* Med årsag pr. linje — ellers står man med en tavs uoverensstemmelse
                  mellem antal linjer indsat og antal poster oprettet. */}
              {skipped.map((s, i) => (
                <AppText key={i} variant="muted" className="text-xs">
                  “{s.line}” — {s.reason}
                </AppText>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      <Button
        title={fresh.length > 0 ? `Tilføj ${fresh.length}` : 'Tilføj'}
        className="h-12"
        disabled={fresh.length === 0}
        loading={saving}
        onPress={() => void save()}
      />
    </Screen>
  );
}
