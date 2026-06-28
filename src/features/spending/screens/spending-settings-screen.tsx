import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { SpendingSettingsForm } from '../components/spending-settings-form';
import { useSpendingSettingsStore } from '../data/spending-settings-store';

export function SpendingSettingsScreen() {
  const accounts = useSpendingSettingsStore((s) => s.accounts);
  const scrubRules = useSpendingSettingsStore((s) => s.scrubRules);

  // key → formens lokale udkast gen-seedes når gemte data ankommer/ændres.
  const accountsKey = accounts.map((a) => `${a.number}:${a.name}:${a.internal}`).join('|');
  const rulesKey = scrubRules.map((r) => `${r.id}:${r.column}:${r.contains}:${r.replaceWith}`).join('|');

  return (
    <Screen>
      <AppText variant="title">Forbrug · indstillinger</AppText>
      <AppText variant="muted">
        Navngiv dine konti og marker dine egne som “Intern konto”, så overførsler mellem
        dem ikke tæller som forbrug. Rense-regler samler varierende tekster (fx skiftende
        adresser i “Indbetaler”).
      </AppText>

      <SpendingSettingsForm key={`${accountsKey}__${rulesKey}`} accounts={accounts} scrubRules={scrubRules} />
    </Screen>
  );
}
