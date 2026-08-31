import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';
import type { CvOverrides, RenderDoc } from '../render/render-doc';

/**
 * Håndrettelser til ÉN ansøgning.
 *
 * ⚠️ Rettelserne hører til ANSØGNINGEN, ikke til kataloget. De gemmes sammen med
 * selectionen og rører aldrig katalogets tekst. Skrev de igennem til kataloget, ville en
 * tilpasning til ét opslag sive ud i alle fremtidige CV'er — og så er kataloget ikke
 * længere sandheden.
 *
 * `basis` er teksten som den står i kataloget. Den er med for at man kan se HVAD man har
 * ændret, og komme tilbage. Uden den kan man rette noget og aldrig finde originalen igen.
 */
export function OverrideEditor({
  doc,
  basis,
  overrides,
  onChange,
  onCommit,
}: {
  /** Det der faktisk vises — rettelser allerede lagt oven på. */
  doc: RenderDoc;
  /** Det samme uden rettelser. */
  basis: RenderDoc;
  overrides: CvOverrides;
  onChange: (next: CvOverrides) => void;
  /** Kaldes når et felt forlades — dér gemmes der, ikke ved hvert tastetryk. */
  onCommit: () => void;
}) {
  const saet = (next: CvOverrides) => onChange(next);

  /** `undefined` FJERNER nøglen frem for at sætte den — en nøgle med `undefined` i ville
   *  blive til `undefined` i JSON'en og se ud som en rettelse der ikke er der. */
  const topSkriv = (felt: 'titel' | 'profiltekst') => (v: string | undefined) => {
    const next = { ...overrides };
    if (v === undefined) delete next[felt];
    else next[felt] = v;
    saet(next);
  };

  /** Én linje: felt + "nulstil" når den afviger fra kataloget. */
  const felt = (
    noegle: string,
    label: string,
    vaerdi: string,
    original: string,
    skriv: (v: string | undefined) => void,
    lang = false
  ) => {
    const rettet = vaerdi !== original;
    return (
      <FormField label={label} key={noegle}>
        <Input
          value={vaerdi}
          onChangeText={(v) => skriv(v)}
          onBlur={onCommit}
          multiline={lang}
          autoGrow={lang}
          className={lang ? 'h-auto min-h-16 py-2' : undefined}
          style={lang ? { textAlignVertical: 'top' } : undefined}
        />
        {rettet ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            className="self-start pt-1"
            onPress={() => {
              // `undefined` og ikke originalteksten: så er feltet ikke længere en rettelse,
              // og retter man i kataloget bagefter, følger CV'et med.
              skriv(undefined);
              onCommit();
            }}>
            <AppText className="text-xs font-semibold text-primary">
              Nulstil til katalogets tekst
            </AppText>
          </Pressable>
        ) : null}
      </FormField>
    );
  };

  const punktSkriv = (id: string) => (v: string | undefined) => {
    const punkter = { ...(overrides.punkter ?? {}) };
    if (v === undefined) delete punkter[id];
    else punkter[id] = v;
    saet({ ...overrides, punkter });
  };

  const projektSkriv = (id: string) => (v: string | undefined) => {
    const projekter = { ...(overrides.projekter ?? {}) };
    if (v === undefined) delete projekter[id];
    else projekter[id] = v;
    saet({ ...overrides, projekter });
  };

  return (
    <View className="gap-4">
      <AppText variant="muted" className="text-sm leading-relaxed">
        Rettelser her gælder KUN denne ansøgning. Kataloget røres ikke, så en formulering du
        skruer til ét opslag, følger ikke med til det næste.
      </AppText>

      <Card className="gap-3">
        <AppText variant="label">Øverst på siden</AppText>
        {felt('titel', 'Titel under navnet', doc.titel, basis.titel, topSkriv('titel'))}
        {felt(
          'profiltekst',
          'Profiltekst',
          doc.profiltekst,
          basis.profiltekst,
          topSkriv('profiltekst'),
          true
        )}
      </Card>

      {doc.jobs.map((job, i) =>
        job.punkter.length ? (
          <Card key={`${job.rende}-${i}`} className="gap-3">
            <AppText variant="label">{job.rolle || job.hvor}</AppText>
            {job.punkter.map((p, j) =>
              felt(
                p.id,
                `Punkt ${j + 1}`,
                p.tekst,
                basis.jobs[i]?.punkter[j]?.tekst ?? p.tekst,
                punktSkriv(p.id),
                true
              )
            )}
          </Card>
        ) : null
      )}

      {doc.projekter.length ? (
        <Card className="gap-3">
          <AppText variant="label">Projekter</AppText>
          {doc.projekter.map((p, i) =>
            felt(
              p.id,
              p.navn || `Projekt ${i + 1}`,
              p.tekst,
              basis.projekter[i]?.tekst ?? p.tekst,
              projektSkriv(p.id),
              true
            )
          )}
        </Card>
      ) : null}
    </View>
  );
}

/**
 * Rettelserne pakket ind i deres egen åbn/luk-knap.
 *
 * Tilstanden bor her og ikke i skærmen: om panelet er åbent, er ikke noget andet på siden
 * har brug for at vide.
 */
export function OverrideSection(props: Parameters<typeof OverrideEditor>[0]) {
  const [aaben, setAaben] = useState(false);
  return (
    <View className="gap-3 border-t border-border pt-5">
      <Pressable accessibilityRole="button" hitSlop={6} onPress={() => setAaben((v) => !v)}>
        <AppText className="text-sm font-semibold text-primary">
          {aaben ? 'Skjul rettelser' : 'Ret teksten til dette opslag'}
        </AppText>
      </Pressable>
      {aaben ? <OverrideEditor {...props} /> : null}
    </View>
  );
}
