import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { IssueList } from '@/components/ui/issue-list';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import type { CvFieldSpec, FieldValues } from '../catalogue/field-spec';
import { docFromValues, valueFromDoc } from '../catalogue/field-spec';
import { validateValues } from '../catalogue/validate-values';
import { CatalogueField } from '../components/catalogue-field';
import { saveCvSettings } from '../data/cv-repos';
import { useCvSettings } from '../data/cv-stores';
import { useCatalogue } from '../hooks/use-catalogue';
import type { CvOm, CvPerson, CvStil } from '../types';

/**
 * Stil, person og om mig — det ene sted der ikke er en kollektion.
 *
 * `stil` er ikke pynt: `grundstoerrelse` og `luft` er de to skruer man kalibrerer CV'et
 * med, når skrifterne eller indholdsmængden ændrer sig. De skal kunne rettes uden en ny
 * udgivelse, og derfor står de her og ikke i koden.
 */
const PERSON_FIELDS: CvFieldSpec[] = [
  { kind: 'text', name: 'navn', label: 'Navn', required: true, placeholder: 'Sebastian Holm Grünberg' },
  { kind: 'i18n', name: 'titel', label: 'Titel', required: true, placeholder: 'Fullstack-udvikler & arkitekt' },
  { kind: 'text', name: 'email', label: 'E-mail', placeholder: 'sebastian@eksempel.dk' },
  { kind: 'text', name: 'telefon', label: 'Telefon', placeholder: '+45 12 34 56 78' },
  { kind: 'text', name: 'by', label: 'By', placeholder: 'Aarhus' },
  { kind: 'image', name: 'foto', label: 'Foto' },
  { kind: 'links', name: 'links', label: 'Links' },
];

const OM_FIELDS: CvFieldSpec[] = [
  // Ikke "Om mig" igen — sektionen hedder allerede det, og to ens overskrifter over
  // hinanden ser ud som om noget er gået galt.
  {
    kind: 'i18n',
    name: 'personlig',
    label: 'Tekst',
    multiline: true,
    required: true,
    placeholder: 'Adskil afsnit med en tom linje.',
  },
  {
    kind: 'i18n',
    name: 'anerkendelse',
    label: 'Slutlinje (vises i kursiv)',
    multiline: true,
    placeholder: 'Afsluttede min uddannelse med karakteren 12.',
  },
];

/** Ingen brandfarve her — den sættes pr. CV, fordi den er modtagerens farve. */
const STIL_FIELDS: CvFieldSpec[] = [
  { kind: 'number', name: 'grundstoerrelse', label: 'Grundstørrelse (pt)' },
  { kind: 'number', name: 'linjeafstand', label: 'Linjeafstand' },
  { kind: 'number', name: 'luft', label: 'Luft' },
];

const load = (fields: CvFieldSpec[], doc: object): FieldValues =>
  Object.fromEntries(
    fields.map((f) => [f.name, valueFromDoc(f, doc as Record<string, unknown>)])
  );

export function CvSettingsScreen() {
  const stil = useCvSettings((s) => s.stil);
  const person = useCvSettings((s) => s.person);
  const om = useCvSettings((s) => s.om);
  const loading = useCvSettings((s) => s.loading);
  const snapshot = useCatalogue();

  const [values, setValues] = useState<FieldValues | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Vent på dokumentet FØR formularen tegnes.
   *
   * `current` fryser ved første tastetryk (`values` går fra null til et objekt). Sker det
   * mens butikken stadig står på `EMPTY_PERSON`, fryser formularen ved lutter tomme felter
   * — og fordi der nu skrives med `merge: false`, ville et tryk på Gem slette navn, titel
   * og hele "Om mig"-teksten og kvittere med "Gemt".
   */
  if (loading) return <LoadingScreen />;

  const current =
    values ?? { ...load(PERSON_FIELDS, person), ...load(OM_FIELDS, om), ...load(STIL_FIELDS, stil) };

  const problems = validateValues([...PERSON_FIELDS, ...OM_FIELDS, ...STIL_FIELDS], current);

  const save = async () => {
    setSaving(true);
    try {
      await saveCvSettings({
        person: docFromValues(PERSON_FIELDS, current) as unknown as CvPerson,
        om: docFromValues(OM_FIELDS, current) as unknown as CvOm,
        stil: docFromValues(STIL_FIELDS, current) as unknown as CvStil,
      });
      router.back();
    } catch {
      // Fejl-toasten kommer fra `saveCvSettings`. Formularen bliver stående med det
      // indtastede i behold.
    } finally {
      setSaving(false);
    }
  };

  const section = (title: string, fields: CvFieldSpec[]) => (
    <View className="gap-3 pt-4">
      <AppText variant="label">{title}</AppText>
      {fields.map((spec) => (
        <CatalogueField
          key={spec.name}
          spec={spec}
          value={current[spec.name]}
          onChange={(next) => setValues({ ...current, [spec.name]: next })}
          snapshot={snapshot}
        />
      ))}
    </View>
  );

  return (
    <Screen>
      <AppText variant="title">Stil og person</AppText>
      {section('Person', PERSON_FIELDS)}
      {section('Om mig', OM_FIELDS)}
      {section('Stil', STIL_FIELDS)}
      <AppText variant="muted" className="text-xs leading-relaxed">
        Luft ganges kun på lodrette mellemrum, aldrig på skriftstørrelser.
        Brandfarven vælges pr. CV — den hører til det firma du søger hos.
      </AppText>

      <IssueList title="ting mangler" items={problems.map((p) => ({ subject: p.hvor, reason: p.hvad }))} />

      <Button
        title="Gem"
        className="h-12"
        disabled={problems.length > 0}
        loading={saving}
        onPress={() => void save()}
      />
    </Screen>
  );
}
