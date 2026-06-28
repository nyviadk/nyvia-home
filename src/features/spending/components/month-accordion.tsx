import type { ReactNode } from "react";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { AppText } from "@/components/ui/text";
import { Pressable, View } from "@/tw";

/**
 * Måned-sektion: header med måned + forbrug, der kan foldes ud. Den nuværende måned
 * er foldet ud som standard, tidligere måneder er foldet sammen (accordion).
 */
export function MonthAccordion({
  title,
  totalOre,
  children,
}: {
  title: string;
  totalOre: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2">
      <Pressable accessibilityRole="button" onPress={() => setOpen((o) => !o)}>
        <Card className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <AppText variant="muted">{open ? "▾" : "▸"}</AppText>
            <AppText variant="label">{title}</AppText>
          </View>
          <View className="items-end">
            <MoneyText
              ore={totalOre}
              whole
              variant="label"
              className="text-danger"
            />
            <AppText variant="muted">forbrug</AppText>
          </View>
        </Card>
      </Pressable>
      {open ? <View className="gap-2">{children}</View> : null}
    </View>
  );
}
