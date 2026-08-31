import { Link } from 'expo-router';
import { useState } from 'react';

import { DeleteRowButton } from '@/components/ui/delete-row-button';
import { Input } from '@/components/ui/input';
import { ListGate } from '@/components/ui/list-gate';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { TinyButton } from '@/components/ui/tiny-button';
import { Pressable, View } from '@/tw';
import { CV_COLLECTIONS, sortDocs } from '../catalogue/registry';
import { CV_REPOS, type CvCollKey } from '../data/cv-repos';
import { moveInOrder } from '../data/reorder';
import { CV_STORES } from '../data/cv-stores';
import { COLL_LABEL, COLL_SINGULAR } from '../labels';

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Listen for ÉN kollektion — den samme skærm for alle ni.
 *
 * Rækkens tekst kommer fra registrets `title`/`subtitle`, så en ny kollektion ikke kræver
 * en ny skærm. Id'et står altid med: det er dét selectionen og menuen peger på, så det er
 * lige så vigtigt som navnet.
 */
export function CatalogueListScreen({ coll }: { coll: CvCollKey }) {
  const store = CV_STORES[coll];
  const def = CV_COLLECTIONS[coll];
  /**
   * Den generiske skærm arbejder STRUKTURELT: felterne kommer fra registret, ikke fra
   * hver kollektions type. Uden konverteringen her er `docs` en union af ni array-typer,
   * som ikke har noget til fælles at sortere eller læse på.
   *
   * Det er sikkert fordi registret er typet mod dokument-typerne — et omdøbt felt er
   * stadig en compile-fejl dér, hvor det hører hjemme.
   */
  const docs = store.useVisibleItems() as unknown as (Record<string, unknown> & { id: string })[];
  const loading = store((s) => s.loading);
  const [query, setQuery] = useState('');

  const q = norm(query);
  const ordered = sortDocs(docs);
  const orderedIds = ordered.map((d) => d.id);
  const byId = Object.fromEntries(ordered.map((d) => [d.id, d as { orden?: number }]));
  /** Pilene giver kun mening på den fulde, sorterede liste — ikke i et søgeresultat. */
  const canReorder = !q && ordered.length > 1;

  const rows = ordered.filter(
    (doc) =>
      !q ||
      norm(doc.id).includes(q) ||
      norm(def.title(doc, 'da')).includes(q) ||
      norm(def.subtitle(doc, 'da')).includes(q)
  );

  return (
    <Screen>
      <ScreenHeader
        title={COLL_LABEL[coll]}
        addHref={{ pathname: '/cv/[coll]/new', params: { coll } }}
        addLabel={`Ny ${COLL_SINGULAR[coll]}`}
      />

      {docs.length > 4 ? (
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Søg…"
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : null}

      <ListGate
        count={rows.length}
        loading={loading}
        empty={{
          title: q ? 'Ingen træffere' : `Ingen ${COLL_LABEL[coll].toLowerCase()} endnu`,
          description: q ? 'Prøv et andet ord.' : 'Opret den første, eller importér kataloget.',
        }}>
        <View>
          {rows.map((doc, i) => {
            const subtitle = def.subtitle(doc, 'da');
            return (
              <View
                key={doc.id}
                className="flex-row items-center gap-3 border-b border-border py-3">
                {canReorder ? (
                  <View className="gap-0.5">
                    <TinyButton
                      label="↑"
                      disabled={i === 0}
                      onPress={() => void moveInOrder(coll, orderedIds, byId, i, i - 1)}
                    />
                    <TinyButton
                      label="↓"
                      disabled={i === rows.length - 1}
                      onPress={() => void moveInOrder(coll, orderedIds, byId, i, i + 1)}
                    />
                  </View>
                ) : null}
                <Link href={{ pathname: '/cv/[coll]/[id]', params: { coll, id: doc.id } }} asChild>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Redigér ${doc.id}`}
                    className="flex-1 gap-0.5 active:opacity-60">
                    <AppText variant="label" numberOfLines={2}>
                      {def.title(doc, 'da') || doc.id}
                    </AppText>
                    <AppText variant="muted" className="text-xs">
                      {doc.id}
                      {subtitle ? ` · ${subtitle}` : ''}
                    </AppText>
                  </Pressable>
                </Link>

                <DeleteRowButton
                  id={doc.id}
                  title={`Slet ${COLL_SINGULAR[coll]}`}
                  name={def.title(doc, 'da') || doc.id}
                  pending={store.pending}
                  remove={() => CV_REPOS[coll].remove(doc.id)}
                />
              </View>
            );
          })}
        </View>
      </ListGate>
    </Screen>
  );
}
