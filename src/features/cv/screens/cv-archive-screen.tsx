import { Link } from 'expo-router';

import { DeleteRowButton } from '@/components/ui/delete-row-button';
import { ListGate } from '@/components/ui/list-gate';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { copyText } from '@/lib/clipboard/copy-text';
import { formatDateCopenhagen, formatDateTimeCopenhagen } from '@/lib/datetime';
import { Pressable, View } from '@/tw';
import { ansoegningerRepo } from '../data/cv-repos';
import { useCvAnsoegninger } from '../data/cv-stores';

/**
 * Hvad blev sendt til hvem, og hvornår.
 *
 * Hele grunden til at ansøgninger gemmes: om et halvt år skal man kunne slå op hvad man
 * faktisk sendte — ikke rekonstruere det. Derfor står selectionen her som den RÅ tekst der
 * blev indsat, og kan kopieres ud igen uden at være gået gennem appens fortolkning.
 *
 * Kører på både web og app: at LÆSE hvad man har sendt er noget man gør fra sofaen. Kun
 * selve genrenderingen er web-only.
 */
export function CvArchiveScreen() {
  const ansoegninger = useCvAnsoegninger.useVisibleItems();
  const loading = useCvAnsoegninger((s) => s.loading);

  return (
    <Screen>
      <AppText variant="title">Gemte ansøgninger</AppText>
      <AppText variant="muted" className="text-sm leading-relaxed">
        Gemmes automatisk når en selection er valideret. Selectionen ligger som den tekst du
        indsatte — byte for byte.
      </AppText>

      <ListGate
        count={ansoegninger.length}
        loading={loading}
        empty={{
          title: 'Ingen ansøgninger endnu',
          description: 'De lægger sig her af sig selv, første gang du laver et CV.',
        }}>
        <View className="gap-0">
          {ansoegninger.map((a) => (
            <View key={a.id} className="flex-row items-center gap-3 border-b border-border py-3">
              <View className="min-w-0 flex-1 gap-0.5">
                <AppText variant="label" className="text-sm">
                  {a.firma || 'Uden firma'}
                </AppText>
                <AppText variant="muted" className="text-xs">
                  {[
                    a.titel,
                    // Ansøgningens egen dato hvis den er sat, ellers hvornår den blev gemt.
                    // Aldrig et tomt felt der ser ud som om oplysningen mangler.
                    a.dato ? formatDateCopenhagen(a.dato) : formatDateTimeCopenhagen(a.createdAt),
                    a.sprog === 'en' ? 'engelsk' : 'dansk',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
                <View className="flex-row gap-4 pt-1">
                  <Link
                    href={{ pathname: '/cv/render', params: { a: a.id } }}
                    asChild>
                    {/* Skærmen tegner CV'et med det samme den åbnes med en gemt ansøgning,
                        så print-knappen står klar — derfor lover linket en PDF. */}
                    <Pressable accessibilityRole="button" hitSlop={6}>
                      <AppText className="text-xs font-semibold text-primary">
                        Åbn og gem som PDF
                      </AppText>
                    </Pressable>
                  </Link>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={6}
                    onPress={() => void copyText(a.selection, 'Selection kopieret')}>
                    <AppText className="text-xs font-semibold text-primary">
                      Kopiér selection
                    </AppText>
                  </Pressable>
                </View>
              </View>
              <DeleteRowButton
                id={a.id}
                title="Slet ansøgning"
                name={`ansøgningen til ${a.firma || 'uden firma'}`}
                pending={useCvAnsoegninger.pending}
                remove={() => ansoegningerRepo.remove(a.id)}
              />
            </View>
          ))}
        </View>
      </ListGate>
    </Screen>
  );
}
