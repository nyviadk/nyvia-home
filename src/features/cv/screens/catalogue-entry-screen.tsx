import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { IssueList } from '@/components/ui/issue-list';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { issue } from '../issues';
import { View } from '@/tw';
import {
  docFromValues,
  slugify,
  SLUG_RE,
  valueFromDoc,
  type FieldValues,
} from '../catalogue/field-spec';
import { validateValues } from '../catalogue/validate-values';
import { CV_COLLECTIONS } from '../catalogue/registry';
import { CV_REPOS, writeWithSlug, type CvCollKey } from '../data/cv-repos';
import { CV_STORES } from '../data/cv-stores';
import { useCatalogue } from '../hooks/use-catalogue';
import { nextOrden } from '../data/reorder';
import { COLL_SINGULAR } from '../labels';
import { CatalogueField } from '../components/catalogue-field';

/**
 * Opret eller redigér ÉN post — den samme skærm for alle ni kollektioner.
 *
 * Felterne kommer fra registret. `id` er et rigtigt felt og ikke et auto-id: selectionen og
 * menuen peger på det, og `mp_kryptering` er til at læse hvor `k3f9x2m1` ikke er.
 */
export function CatalogueEntryScreen({ coll, id }: { coll: CvCollKey; id?: string }) {
  const def = CV_COLLECTIONS[coll];
  const store = CV_STORES[coll];
  const snapshot = useCatalogue();
  const { item, loading } = store.useItem(id);
  const existing = id ? (item as unknown as Record<string, unknown> | undefined) : undefined;

  const [slug, setSlug] = useState(id ?? '');
  // Har man rørt id-feltet, holder appen op med at foreslå — ellers ville forslaget
  // overskrive det man selv har skrevet, hver gang man rettede i navnet.
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<FieldValues | null>(null);

  if (id && !item) {
    /**
     * Uden dette faldt man igennem til en TOM formular med id'et låst — og et tryk på Gem
     * ville skrive en tom post oven i den rigtige. En post der ikke findes, skal ikke se
     * ud som en man er ved at oprette.
     */
    return loading ? (
      <LoadingScreen />
    ) : (
      <Screen>
        <AppText variant="title">Findes ikke</AppText>
        <AppText variant="muted">Posten “{id}” er ikke i kataloget — måske er den slettet.</AppText>
      </Screen>
    );
  }

  const current: FieldValues =
    values ??
    Object.fromEntries(def.fields.map((f) => [f.name, valueFromDoc(f, existing)]));

  const setField = (name: string, next: FieldValues[string]) => {
    const updated = { ...current, [name]: next };
    setValues(updated);
    if (!slugTouched) {
      const source = def.fields.find((f) => f.required && f.kind !== 'ref')?.name;
      const v = source ? updated[source] : undefined;
      const text = v?.t === 'text' ? v.v : v?.t === 'i18n' ? v.da : '';
      if (text) setSlug(slugify(text));
    }
  };

  const problems = [
    ...validateValues(def.fields, current, snapshot),
    ...(slug.trim() === '' ? [issue('ID', 'Skal udfyldes')] : []),
    ...(slug && !SLUG_RE.test(slug) ? [issue('ID', 'Kun a-z, 0-9 og _')] : []),
    ...(!id && slug && snapshot[coll][slug] ? [issue('ID', `"${slug}" findes allerede`)] : []),
    /**
     * Dubletkontrollen lige ovenfor er kun sand hvis kollektionen ER hentet. En tom butik
     * ser ud som "id'et er ledigt", og `writeWithSlug` skriver med `merge:false` — så et
     * nyoprettet job med samme navn ville ERSTATTE det gamle, med alle dets punkter
     * hængende ved et id der nu betyder noget andet. Derfor må Gem vente på listen.
     */
    ...(!id && loading ? [issue('Katalog', 'Henter listen — vent lige')] : []),
  ];

  const save = async () => {
    setSaving(true);
    try {
      /**
       * `orden` sættes af appen, ikke af brugeren. Nye poster lægges SIDST — man ved
       * sjældent hvor noget skal ind når man opretter det, og rækkefølgen flyttes
       * bagefter med pilene i listen.
       */
      const orden =
        typeof existing?.orden === 'number'
          ? existing.orden
          : nextOrden(Object.values(snapshot[coll]) as { orden?: number }[]);

      await writeWithSlug(coll, slug, {
        ...docFromValues(def.fields, current),
        orden,
        ...(existing?.createdAt ? { createdAt: existing.createdAt } : {}),
      });
      router.back();
    } catch {
      // Fejl-toasten kommer fra `writeWithSlug`. Vi bliver stående på formularen, så det
      // man har skrevet ikke er væk, og Gem kan prøves igen.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">
        {id ? 'Redigér' : 'Ny'} {COLL_SINGULAR[coll]}
      </AppText>

      <FormField label="ID">
        <Input
          value={slug}
          onChangeText={(v) => {
            setSlugTouched(true);
            setSlug(v);
          }}
          editable={!id}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="fx mp_kryptering"
        />
      </FormField>
      <AppText variant="muted" className="-mt-2 text-xs">
        {id
          ? 'ID kan ikke ændres — selections og gemte ansøgninger peger på det.'
          : 'Bruges i menuen og i selections. Foreslås ud fra navnet.'}
      </AppText>

      {def.fields.map((spec) => (
        <CatalogueField
          key={spec.name}
          spec={spec}
          value={current[spec.name]}
          onChange={(next) => setField(spec.name, next)}
          snapshot={snapshot}
        />
      ))}

      <IssueList title="ting mangler" items={problems.map((p) => ({ subject: p.hvor, reason: p.hvad }))} />

      <Button
        title={id ? 'Gem' : 'Opret'}
        className="h-12"
        disabled={problems.length > 0}
        loading={saving}
        onPress={() => void save()}
      />

      {id ? (
        <DeleteEntityLink
          id={id}
          label={`Slet ${COLL_SINGULAR[coll]}`}
          name={def.title(existing ?? {}, 'da') || id}
          pending={store.pending}
          remove={() => CV_REPOS[coll].remove(id)}
        />
      ) : (
        <View className="pb-6" />
      )}
    </Screen>
  );
}
