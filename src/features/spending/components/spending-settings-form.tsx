import { useState } from "react";

import { Button } from "@/components/ui/button";
import { View } from "@/tw";
import { saveSpendingSettings } from "../data/spending-settings.repository";
import type { OwnAccount, ScrubRule } from "../types";
import { OwnAccountEditor } from "./own-account-editor";
import { ScrubRuleEditor } from "./scrub-rule-editor";

export function SpendingSettingsForm({
  accounts,
  scrubRules,
}: {
  accounts: OwnAccount[];
  scrubRules: ScrubRule[];
}) {
  const [draftAccounts, setDraftAccounts] = useState<OwnAccount[]>(accounts);
  const [draftRules, setDraftRules] = useState<ScrubRule[]>(scrubRules);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await saveSpendingSettings(
        draftAccounts
          // Sørg for at gemme, hvis enten number, name ELLER text er udfyldt
          .filter((a) => a.number?.trim() || a.name?.trim() || a.text?.trim())
          .map((a) => ({
            number: a.number?.trim() || "",
            text: a.text?.trim() || "",
            name: a.name?.trim() || "",
            internal: a.internal,
          })),
        draftRules.filter((r) => r.contains.trim()),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="gap-4">
      <OwnAccountEditor value={draftAccounts} onChange={setDraftAccounts} />
      <ScrubRuleEditor value={draftRules} onChange={setDraftRules} />
      <Button title="Gem ændringer" loading={saving} onPress={save} />
    </View>
  );
}
