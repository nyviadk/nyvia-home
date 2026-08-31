import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DeleteRowButton } from '@/components/ui/delete-row-button';
import { Input } from '@/components/ui/input';
import { IssueList } from '@/components/ui/issue-list';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { copyText } from '@/lib/clipboard/copy-text';
import { formatDateTimeCopenhagen } from '@/lib/datetime';
import { View } from '@/tw';
import { buildExport, parseImport, type ImportStatus } from '../data/catalogue-io';
import { useCvImports, useCvSettings } from '../data/cv-stores';
import { deleteImported, findImportedIds, importCatalogue } from '../data/import-catalogue';
import { useCatalogue } from '../hooks/use-catalogue';
import { buildImportPrompt } from '../menu/import-prompt';
import { COLL_LABEL } from '../labels';

const STATUS_TEXT: Record<ImportStatus, string> = {
  ny: 'tilføjes',
  afviger: 'findes allerede med andet indhold — springes over',
  uændret: 'findes allerede',
};

/**
 * Ind og ud med hele kataloget i ét stykke JSON — samme form som prototypens `cv-data.json`.
 *
 * Importen TILFØJER kun. Den overskriver aldrig en post der findes, og sletter aldrig noget.
 * Retter man i kataloget, gør man det i appen — så kan en fil man kører igennem igen ikke
 * skrive en dags arbejde væk uden at nævne det.
 */
export function CvIoScreen() {
  const snapshot = useCatalogue();
  const stil = useCvSettings((s) => s.stil);
  const person = useCvSettings((s) => s.person);
  const om = useCvSettings((s) => s.om);
  const settingsLoading = useCvSettings((s) => s.loading);
  const settingsExists = useCvSettings((s) => s.exists);
  const imports = useCvImports.useVisibleItems();

  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  /**
   * Vent på indstillingsdokumentet.
   *
   * Import af `stil`/`person`/`om` er featurens ENESTE ikke-additive skrivning, og den er
   * spærret af "findes de i forvejen?". Før dokumentet er hentet er svaret nej, og en
   * hurtig finger kunne nå at skrive filens stil og "Om mig" hen over sin egen.
   *
   * `exists` og ikke "har personen et navn?": et tomt navn er en gyldig tilstand, og at
   * udlede det af indholdet gør et tomt felt til en tilladelse til at overskrive.
   */
  if (settingsLoading) return <LoadingScreen />;

  // Udledt under render — ingen state, ingen effect. Parsningen er ren.
  const plan = parseImport(text, snapshot, settingsExists);

  const doExport = () =>
    void copyText(
      buildExport(snapshot, { stil, person, om }, { redigeret: true }),
      'Kopieret uden kontaktoplysninger'
    );

  const doPrompt = () =>
    void copyText(
      buildImportPrompt(snapshot),
      'Vejledningen er kopieret — indsæt den sammen med din tekst'
    );

  const doImport = async () => {
    setSaving(true);
    try {
      await importCatalogue(plan);
      setText('');
    } catch {
      // `toastAfter` har allerede sagt til. Fanges her, så en fejlet skrivning ikke bliver
      // til en ubehandlet rejection — og så teksten bliver stående og kan prøves igen.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Import og eksport</AppText>

      <Card className="gap-2">
        <AppText variant="label">Eksport</AppText>
        <AppText variant="muted" className="text-sm leading-relaxed">
          Kataloget som ét JSON-dokument. Tidsstempler udelades — det er appens bogholderi,
          ikke dine data.
        </AppText>
        <Button
          title="Kopiér til deling"
          variant="secondary"
          onPress={doExport}
        />
        <AppText variant="muted" className="text-xs leading-relaxed">
          E-mail og telefon sløres til xxxx@gmail.com og +45 xx xx xx xx — også dine
          referencers. Formen bliver stående, så modtageren kan se at oplysningen findes.
        </AppText>

      </Card>

      <Card className="gap-2">
        <AppText variant="label">Skriv nye poster med hjælp</AppText>
        <AppText variant="muted" className="text-sm leading-relaxed">
          Kopiér en vejledning til en AI der intet ved om kataloget, indsæt den sammen med
          din løse tekst — punkter, kompetencer, hvad som helst — og få JSON tilbage du kan
          indsætte nedenfor. Vejledningen indeholder dine job- og gruppe-id'er, så nye poster
          hægter sig på det rigtige, og de optagede id'er, så intet støder sammen.
        </AppText>
        <Button title="Kopiér vejledning" variant="secondary" onPress={doPrompt} />
      </Card>

      <View className="gap-2 pt-2">
        <AppText variant="label">Import</AppText>
        <AppText variant="muted" className="text-sm leading-relaxed">
          Tilføjer kun. Poster der allerede findes, røres ikke — heller ikke hvis filen siger
          noget andet. Der slettes aldrig noget.
        </AppText>
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Indsæt cv-data.json her…"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          className="h-64 py-3"
          style={{ textAlignVertical: 'top', fontFamily: 'monospace' }}
        />
      </View>

      {text.trim() ? (
        <Card className="gap-3">
          <AppText variant="label">
            {plan.ny} tilføjes · {plan.uaendret + plan.afviger} findes allerede
            {plan.settings ? ' · stil/person/om' : ''}
          </AppText>

          {plan.collections.map(({ key, rows }) => {
            const nye = rows.filter((r) => r.status === 'ny');
            const afvigende = rows.filter((r) => r.status === 'afviger');
            return (
              <View key={key} className="gap-0.5">
                <AppText variant="muted" className="text-xs uppercase">
                  {COLL_LABEL[key]} · {nye.length} af {rows.length}
                </AppText>
                {nye.map((row) => (
                  <AppText key={row.id} variant="muted" className="text-xs">
                    {row.id} — {STATUS_TEXT.ny}
                  </AppText>
                ))}
                {/* Afvigende fremhæves: her tror man let at ens rettelse i filen slog
                    igennem, og den eneste måde at opdage andet på er at det står her. */}
                {afvigende.map((row) => (
                  <AppText key={row.id} className="text-xs text-warning">
                    {row.id} — {STATUS_TEXT.afviger}
                  </AppText>
                ))}
              </View>
            );
          })}

          <IssueList
            title="ting springes over"
            items={plan.issues.map((i) => ({
              subject: i.hvor,
              reason: i.hvad,
              options: i.muligheder,
            }))}
            tone="warning"
          />
        </Card>
      ) : null}

      <Button
        title={plan.ny > 0 ? `Tilføj ${plan.ny} poster` : 'Tilføj til katalog'}
        className="h-12"
        disabled={plan.ny === 0 && !plan.settings}
        loading={saving}
        onPress={() => void doImport()}
      />

      {imports.length > 0 ? (
        <View className="gap-1 border-t border-border pt-5">
          <AppText variant="label">Tidligere importer</AppText>
          <AppText variant="muted" className="text-sm leading-relaxed">
            Sletter man en import, fjernes præcis de poster den oprettede. Har du rettet en
            af dem i appen siden, bliver den stående.
          </AppText>
          {imports.map((imp) => {
            const targets = findImportedIds(snapshot, imp.id);
            return (
              <View
                key={imp.id}
                className="flex-row items-center gap-3 border-b border-border py-3">
                <View className="flex-1 gap-0.5">
                  <AppText variant="label" className="text-sm">
                    {imp.antal} poster
                  </AppText>
                  <AppText variant="muted" className="text-xs">
                    {formatDateTimeCopenhagen(imp.createdAt)} ·{' '}
                    {targets.length === imp.antal
                      ? 'alle tilbage'
                      : `${targets.length} tilbage, ${imp.antal - targets.length} rettet eller slettet`}
                  </AppText>
                </View>
                <DeleteRowButton
                  id={imp.id}
                  title="Slet import"
                  name={`importen med ${imp.antal} poster`}
                  confirmMessage={`Fjern de ${targets.length} poster der stadig stammer fra denne import?`}
                  pending={useCvImports.pending}
                  remove={() => deleteImported(targets, imp.id)}
                />
              </View>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}
