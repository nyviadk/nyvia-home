import { useState } from 'react';
import { Modal } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Pressable, ScrollView, Text, View } from '@/tw';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View className="gap-1">
      <AppText variant="label">{title}</AppText>
      <AppText variant="muted">{children}</AppText>
    </View>
  );
}

/** Lille "i"-knap der åbner en forklaring på realistisk vs. hensat forecast. */
export function ForecastInfoButton() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Om visningerne"
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={{ borderCurve: 'continuous' }}
        className="h-6 w-6 items-center justify-center rounded-full border border-border bg-element active:bg-selected">
        <Text className="text-xs font-bold text-fg-muted">i</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          onPress={close}
          style={{ backgroundColor: 'rgba(40, 40, 38, 0.35)', cursor: 'auto' }}
          className="flex-1 items-center justify-center p-6">
          <Pressable
            onPress={() => {}}
            style={{
              boxShadow: '0 8px 24px rgba(40, 40, 38, 0.18)',
              borderCurve: 'continuous',
              cursor: 'auto',
            }}
            className="max-h-[85%] w-full max-w-96 rounded-2xl border border-border bg-card">
            <ScrollView contentContainerClassName="gap-3 p-5" showsVerticalScrollIndicator={false}>
              <AppText variant="heading">Sådan læses tallene</AppText>

              <Section title="Realistisk">
                Hvert beløb tælles i den måned det faktisk falder. En stor regning (fx en årlig
                forsikring) får netop den måned til at dykke — præcis som din konto oplever det.
              </Section>

              <Section title="Hensat">
                Periodiske regninger (kvartals-, halvårs- og årlige) fordeles jævnt ud som en
                månedlig hensættelse — også i månederne FØR næste forfald. En årlig forsikring på
                3.600 kr. tæller altså som 300 kr./md. hele året, så ingen enkelt måned dykker på
                grund af den. God til at se hvad du reelt har til rådighed pr. måned.
              </Section>

              <Section title="Niveauet kan stadig skifte">
                Hensat gør ikke alt fladt. En post der starter eller stopper (fx en tidsbegrænset
                månedlig udgift), en prisændring, eller et lån der bliver betalt ud, ændrer stadig
                beløbet fra den måned det sker — og det er meningen.
              </Section>

              <Section title="Forventet vs. Aktuel">
                Forventet bruger dine planlagte beløb. Aktuel bruger de faktiske beløb, hvor du har
                tastet dem ind (kun i realistisk visning). Månedens net bæres først videre til næste
                måned, når måneden er omme.
              </Section>

              <Pressable
                accessibilityRole="button"
                onPress={close}
                style={{ borderCurve: 'continuous' }}
                className="mt-1 h-11 items-center justify-center rounded-xl bg-primary active:bg-primary/80">
                <Text className="font-semibold text-on-primary">Forstået</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
