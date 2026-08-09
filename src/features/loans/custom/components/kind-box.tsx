import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/**
 * "Udgifter"- / "Indtægter"-kassen i flytte-lånets editorer.
 *
 * Typen på en post afgøres af hvilken kasse man tilføjer den i — der er bevidst ingen
 * fortegn-toggle. Kassen lå ordret i fire editorer (formular + detalje × tabel + poster).
 */
export function KindBox({
  title,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <View className="gap-2 rounded-xl border border-border p-3">
      <AppText variant="label">{title}</AppText>
      {children}
      <Button title={addLabel} variant="secondary" onPress={onAdd} />
    </View>
  );
}
