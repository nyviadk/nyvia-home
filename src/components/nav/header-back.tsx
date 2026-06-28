import { router, type Href } from 'expo-router';

import { AppText } from '@/components/ui/text';
import { Pressable } from '@/tw';

/**
 * headerLeft-tilbageknap der navigerer rent via expo-router (`dismissTo`) til en fast
 * forælder-sti. Undgår at route-parametre (fx ?id=) slæbes med som query, når stakken
 * popper til ankeret ved deep-link/reload. Ingen browser-history involveret.
 */
export function headerBackTo(fallback: Href) {
  return function HeaderBack() {
    return (
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        className="py-1 pr-3"
        onPress={() => router.dismissTo(fallback)}>
        <AppText className="text-base text-primary">‹ Tilbage</AppText>
      </Pressable>
    );
  };
}
