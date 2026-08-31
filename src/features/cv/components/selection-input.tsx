import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IssueList } from '@/components/ui/issue-list';
import { FormField } from '@/components/ui/form-field';
import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';
import type { CvIssue } from '../issues';

/** Samme regel som i `parseSelection` — farven skrives ubehandlet ind i print-CSS'en. */
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * De to trin før der er et CV: kopiér menuen ud, indsæt Claudes svar ind.
 *
 * Trin 3 og 4 sker uden for appen, og det er med vilje — der bygges ingen API-integration.
 * Derfor er dette skærmens vigtigste del: den skal gøre det indlysende hvad man kopierer
 * hvorhen.
 *
 * Feltet har FAST højde og ikke `autoGrow`. Man paster et helt selection-JSON ind, og et
 * felt der vokser med indholdet ville skubbe alt andet en skærmlængde ned.
 */
export function SelectionInput({
  text,
  onChangeText,
  fejl,
  antal,
  sprog,
  klar,
  onKopierMenu,
  onSkabelon,
  harEgenStandard,
  onGemSomStandard,
  brandfarve,
  onBrandfarve,
  onRyd,
  katalogTomt,
  menuLinjer,
}: {
  text: string;
  onChangeText: (v: string) => void;
  fejl: readonly CvIssue[];
  antal: { punkter: number; kompetencer: number; projekter: number };
  sprog: 'da' | 'en' | null;
  klar: boolean;
  onKopierMenu: () => void;
  onSkabelon: () => void;
  /** Har man gemt sit eget standard-CV, eller er det appens udgangspunkt? */
  harEgenStandard: boolean;
  /** Sat når det man står med kan gemmes som standard. */
  onGemSomStandard?: () => void;
  brandfarve: string;
  onBrandfarve: (v: string) => void;
  onRyd: () => void;
  katalogTomt: boolean;
  /** Hvor mange linjer menuen fylder — så man kan se at kataloget FAKTISK er med. */
  menuLinjer: number;
}) {
  return (
    <>
      <Card className="gap-2">
        <AppText variant="label">1 · Kopiér menuen</AppText>
        <AppText variant="muted" className="text-sm leading-relaxed">
          Menuen er hele dit katalog skrevet ud: hvert job, punkt, projekt og kompetence med
          sit ID og sin sandhed. Indsæt den i Claude sammen med jobopslaget — Claude vælger
          så blandt DINE ID'er i stedet for at formulere noget nyt. Det er dét, der gør at
          fakta ikke kan skride.
        </AppText>
        {katalogTomt ? (
          <AppText className="text-sm text-warning">
            Kataloget er tomt, så menuen ville kun indeholde overskrifter. Opret poster eller
            importér din cv-data.json først.
          </AppText>
        ) : (
          <AppText variant="muted" className="text-xs">
            {menuLinjer} linjer katalog følger med.
          </AppText>
        )}
        <Button
          title="Kopiér menu"
          variant="secondary"
          disabled={katalogTomt}
          onPress={onKopierMenu}
        />
      </Card>

      <View className="gap-2 pt-2">
        <View className="flex-row items-center justify-between">
          <AppText variant="label">2 · Indsæt svaret</AppText>
          {/* Udkastet gemmes lokalt og overlever at man går ind i kataloget og tilbage.
              Derfor skal der også være en måde at komme af med det på. */}
          {text.trim() ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onRyd}>
              <AppText className="text-sm text-danger">Ryd</AppText>
            </Pressable>
          ) : null}
        </View>

        <Input
          value={text}
          onChangeText={onChangeText}
          placeholder="Indsæt selection-JSON her…"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          className="h-56 py-3"
          style={{ textAlignVertical: 'top', fontFamily: 'monospace' }}
        />

        {/* Det almindelige CV, færdigt. En tom skabelon stod her før og hjalp ikke: man
            skulle stadig slå hvert id op i menuen for at komme i gang. */}
        {!text.trim() ? (
          <Pressable accessibilityRole="button" hitSlop={6} onPress={onSkabelon}>
            <AppText className="text-sm font-semibold text-primary">
              …eller indsæt {harEgenStandard ? 'mit gemte standard-CV' : 'et standard-CV'} og
              ret i det
            </AppText>
          </Pressable>
        ) : null}

        {/*
          Sådan RETTER man standarden: byg det CV man vil starte fra næste gang, og gem det.
          Der er ingen separat editor — den ville være en tredje kopi af det samme felt.
        */}
        {onGemSomStandard ? (
          <Pressable accessibilityRole="button" hitSlop={6} onPress={onGemSomStandard}>
            <AppText className="text-sm font-semibold text-primary">
              Gem dette som mit standard-CV
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {/* Alle fejl på én gang. Kom de én ad gangen, skulle man rette, køre igen, og finde
          den næste — fem gange i træk. */}
      {text.trim() && fejl.length ? (
        <IssueList
          title="ting passer ikke"
          items={fejl.map((f) => ({ subject: f.hvor, reason: f.hvad, options: f.muligheder }))}
        />
      ) : null}

      {klar ? (
        <>
          <AppText variant="muted" className="text-sm">
            {antal.punkter} punkter · {antal.kompetencer} kompetencer · {antal.projekter}{' '}
            projekter · {sprog === 'en' ? 'engelsk' : 'dansk'}
          </AppText>

          {/*
            Farven hører til DENNE ansøgning — den er modtagerens, ikke din. Claude gætter den
            ud fra jobopslaget, men et gæt på et firmas farve er tit forkert, så den skal kunne
            rettes med øjnene på resultatet. Feltet vinder over selectionens værdi.
          */}
          <FormField label="Brandfarve">
            <View className="flex-row items-center gap-3">
              <View
                className="h-10 w-10 rounded-lg border border-border"
                style={{ backgroundColor: brandfarve }}
              />
              <Input
                value={brandfarve}
                onChangeText={onBrandfarve}
                placeholder="#0b5c3b"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-10 flex-1"
              />
            </View>
          </FormField>
          {!HEX_RE.test(brandfarve) ? (
            <AppText className="-mt-1 text-xs text-warning">
              Skal være en hex-farve som #0b5c3b — ellers bruges standardfarven.
            </AppText>
          ) : null}
        </>
      ) : null}
    </>
  );
}
