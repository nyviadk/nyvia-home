import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppText } from "@/components/ui/text";
import { Pressable, Switch, View } from "@/tw";
import { useState } from "react";
import type { OwnAccount } from "../types";

export function OwnAccountEditor({
  value,
  onChange,
}: {
  value: OwnAccount[];
  onChange: (next: OwnAccount[]) => void;
}) {
  // Accordion state til eksterne konti
  const [showExternal, setShowExternal] = useState(false);

  // Vigtigt: update og remove bruger nu originalIndex for at ændre i det korrekte array
  const update = (originalIndex: number, patch: Partial<OwnAccount>) =>
    onChange(
      value.map((a, idx) => (idx === originalIndex ? { ...a, ...patch } : a)),
    );

  const remove = (originalIndex: number) =>
    onChange(value.filter((_, idx) => idx !== originalIndex));

  const addInternal = () =>
    onChange([...value, { number: "", name: "", text: "", internal: true }]);

  const addExternal = () => {
    onChange([...value, { number: "", name: "", text: "", internal: false }]);
    setShowExternal(true); // Åbn automatisk accordion, når der tilføjes
  };

  // Vi mapper først for at gemme det oprindelige index (_idx), før vi filtrerer
  const myAccounts = value
    .map((a, i) => ({ ...a, _idx: i }))
    .filter((a) => a.internal);
  const externalAccounts = value
    .map((a, i) => ({ ...a, _idx: i }))
    .filter((a) => !a.internal);

  // Hjælpefunktion til at tegne en enkelt "konto-blok"
  const renderAccountItem = (
    a: OwnAccount & { _idx: number },
    isInternal: boolean,
  ) => (
    <View key={a._idx} className="gap-2 border-b border-border pb-3 mb-3">
      <View className="flex-row items-center justify-between">
        <AppText variant="muted">
          {isInternal ? "Konto-nr." : "Transaktions-tekst"}
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => remove(a._idx)}
          hitSlop={8}
        >
          <AppText className="text-sm text-danger">Fjern</AppText>
        </Pressable>
      </View>

      {/* Viser Number-input for interne, Text-input for eksterne - eller begge */}
      {isInternal ? (
        <Input
          value={a.number}
          onChangeText={(t) => update(a._idx, { number: t })}
          placeholder="fx 54950001027564"
          keyboardType="number-pad"
        />
      ) : (
        <Input
          value={a.text || ""}
          onChangeText={(t) => update(a._idx, { text: t })}
          placeholder="fx Debitcard DK NETTO"
        />
      )}

      <Input
        value={a.name}
        onChangeText={(t) => update(a._idx, { name: t })}
        placeholder={
          isInternal ? "Navn (fx Madkonto)" : "Kategori/Navn (fx Dagligvarer)"
        }
      />

      <View className="flex-row items-center justify-between mt-1">
        <AppText variant="label">Intern konto (min egen)</AppText>
        <Switch
          value={a.internal}
          onValueChange={(internal) => update(a._idx, { internal })}
        />
      </View>
    </View>
  );

  return (
    <Card className="gap-3">
      {/* SEKTION 1: MINE KONTI */}
      <AppText variant="label" className="text-lg">
        Mine konti
      </AppText>
      {myAccounts.length === 0 ? (
        <AppText variant="muted">Ingen interne konti endnu.</AppText>
      ) : (
        myAccounts.map((a) => renderAccountItem(a, true))
      )}
      <Button
        title="Tilføj intern konto"
        variant="secondary"
        onPress={addInternal}
      />

      {/* SEKTION 2: EKSTERNE KONTI (ACCORDION) */}
      <Pressable
        className="flex-row items-center justify-between py-2 mt-4 border-b border-border"
        onPress={() => setShowExternal(!showExternal)}
      >
        <AppText variant="label" className="text-lg">
          Eksterne konti ({externalAccounts.length})
        </AppText>
        <AppText variant="muted">{showExternal ? "Skjul ▲" : "Vis ▼"}</AppText>
      </Pressable>

      {showExternal && (
        <View className="mt-2">
          {externalAccounts.length === 0 ? (
            <AppText variant="muted" className="mb-3">
              Ingen eksterne konti oprettet.
            </AppText>
          ) : (
            externalAccounts.map((a) => renderAccountItem(a, false))
          )}
          <Button
            title="Tilføj ekstern konto"
            variant="secondary"
            onPress={addExternal}
          />
        </View>
      )}
    </Card>
  );
}
