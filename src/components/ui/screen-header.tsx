import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/**
 * Titel-rækken øverst på en liste-skærm, med en valgfri primær handling til højre.
 *
 * `h-10 px-4` på knappen stod hardkodet på syv skærme — én afvigelse dér og knapperne
 * stod i forskellig højde fra skærm til skærm.
 */
export function ScreenHeader({
  title,
  addHref,
  addLabel = 'Tilføj',
  children,
}: {
  title: string;
  /** Sæt for at få en "Tilføj"-knap til højre. */
  addHref?: Href;
  addLabel?: string;
  /** Ekstra handlinger til højre for titlen (fx en Indstillinger-knap). */
  children?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <AppText variant="title">{title}</AppText>
      {children || addHref ? (
        <View className="flex-row gap-2">
          {children}
          {addHref ? (
            <Link href={addHref} asChild>
              <Button title={addLabel} className="h-10 px-4" />
            </Link>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
