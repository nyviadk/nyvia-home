import { useState } from 'react';

import { AppText, type AppTextProps } from './text';
import { Pressable } from '@/tw';

export interface ExpandableTextProps extends AppTextProps {
  text: string;
  /** Antal linjer når den er foldet sammen. */
  collapsedLines?: number;
}

/** Lang tekst klippet til få linjer; tryk for at folde ud/sammen. */
export function ExpandableText({ text, collapsedLines = 2, ...props }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable accessibilityRole="button" onPress={() => setExpanded((e) => !e)}>
      <AppText variant="muted" numberOfLines={expanded ? undefined : collapsedLines} {...props}>
        {text}
      </AppText>
    </Pressable>
  );
}
