import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { Pressable, Text, TextInput, View } from '@/tw';
import { CopyButton } from './copy-button';

export type PromptChip = { id: string; name: string; n: number; bg: string; accent: string };

/** Ét prompt-kort: titel/undertekst + valgfri "indsætter automatisk"-strip + kopiér + se-prompt. */
export function PromptCard({
  title,
  sub,
  prompt,
  chips,
  canCopy = true,
}: {
  title: string;
  sub: string;
  prompt: string;
  chips?: PromptChip[];
  canCopy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="gap-3">
      <View>
        <AppText variant="label" className="text-base">
          {title}
        </AppText>
        <AppText variant="muted">{sub}</AppText>
      </View>

      {chips ? (
        <View className="rounded-lg bg-element px-3 py-2.5">
          <AppText variant="muted" className="mb-1.5 text-[10px] uppercase">
            prompten indsætter automatisk
          </AppText>
          <View className="flex-row flex-wrap gap-1.5">
            {chips.map((c) => (
              <View key={c.id} style={{ backgroundColor: c.bg }} className="rounded-full px-2.5 py-0.5">
                <Text style={{ color: c.accent }} className="text-xs">
                  {c.name} · {c.n}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="flex-row items-center gap-4">
        <CopyButton text={prompt} disabled={!canCopy} />
        <Pressable accessibilityRole="button" hitSlop={6} onPress={() => setOpen((o) => !o)}>
          <AppText variant="muted">{open ? 'skjul prompt' : 'se prompt'}</AppText>
        </Pressable>
      </View>

      {open ? (
        <TextInput
          editable={false}
          multiline
          value={prompt}
          scrollEnabled
          className="rounded-lg border border-border bg-element px-3 py-2 text-xs text-fg-muted"
          style={{ fontFamily: 'monospace', minHeight: 180, maxHeight: 340 }}
        />
      ) : null}
    </Card>
  );
}
