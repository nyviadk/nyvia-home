import { Linking } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Pressable } from '@/tw';
import type { EviDescription } from '../types';

/** Felt-beskrivelse: ren tekst, eller (hvis href sat) et klikbart link. */
export function DescriptionWithLink({ description }: { description: EviDescription }) {
  const text = description.text?.trim() ?? '';
  const href = description.href?.trim();
  if (!text && !href) return null;

  if (href) {
    return (
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(href)} hitSlop={4}>
        <AppText variant="muted" className="break-all text-accent-evi underline">
          {text || href}
        </AppText>
      </Pressable>
    );
  }
  return <AppText variant="muted">{text}</AppText>;
}
