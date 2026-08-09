import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppText } from "@/components/ui/text";
import { Switch, View } from "@/tw";

export interface AccountDraft {
  name: string;
  internal: boolean;
  text: string;
}

/**
 * Navngivning af konti der først dukker op i denne CSV.
 *
 * "Intern" betyder min egen konto: overførsler til/fra den tæller ikke som forbrug.
 * Eksterne matches på transaktions-teksten, derfor er den redigerbar.
 */
export function NewAccountsEditor({
  accounts,
  draftFor,
  onChange,
}: {
  accounts: readonly { number: string; text: string }[];
  draftFor: (acc: { number: string; text: string }) => AccountDraft;
  onChange: (accountNumber: string, draft: AccountDraft) => void;
}) {
  return (
    <Card className="gap-3">
      <View className="gap-0.5">
        <AppText variant="label">Nye konti fundet</AppText>
        <AppText variant="muted">
          Navngiv dem, og sæt kryds i “Intern konto” ved dine egne — så tæller overførsler
          til/fra dem ikke som forbrug. Eksterne matches på transaktions-teksten.
        </AppText>
      </View>

      {accounts.map((acc) => {
        const d = draftFor(acc);
        const patch = (next: Partial<AccountDraft>) => onChange(acc.number, { ...d, ...next });
        return (
          <View key={acc.number} className="gap-1.5 border-b border-border pb-3">
            <AppText variant="muted">ID/Konto: {acc.number}</AppText>
            <Input
              value={d.text}
              onChangeText={(text) => patch({ text })}
              placeholder="Transaktions-tekst (fx Netto)"
            />
            <Input
              value={d.name}
              onChangeText={(name) => patch({ name })}
              placeholder="Navn (fx Madkonto / Dagligvarer)"
            />
            <View className="flex-row items-center justify-between">
              <AppText variant="label">Intern konto (min egen)</AppText>
              <Switch value={d.internal} onValueChange={(internal) => patch({ internal })} />
            </View>
          </View>
        );
      })}
    </Card>
  );
}
