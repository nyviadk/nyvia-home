import { Fragment, type ReactNode } from 'react';

import { AppText } from '@/components/ui/text';
import { Text, View } from '@/tw';

/**
 * Let, afhængighedsfri markdown-visning (nok til mentor-feedback). Blok: overskrifter, punkt-/
 * nummer-lister, citat, kode-hegn, linje. Inline: **fed**, *kursiv*, `kode`, [link](url).
 * Ikke en fuld CommonMark-parser — bevidst simpel og OTA-venlig.
 */

// Ét inline-mønster (backticks først, så ** inde i kode ikke tolkes). BEVIDST ingen `_kursiv_`:
// dev-feedback er fuld af snake_case (invalid_grant, GOOGLE_CALENDAR_QUEUE) som ikke må mistes —
// kursiv laves kun med *stjerner*.
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function openUrl(url: string) {
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
}

function renderInline(text: string): ReactNode {
  return text
    .split(INLINE)
    .filter((s) => s !== '')
    .map((part, i) => {
      if (/^`[^`]+`$/.test(part)) {
        return (
          <Text key={i} className="rounded bg-element px-1 text-[13px] text-fg" style={{ fontFamily: 'monospace' }}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return (
          <Text key={i} className="font-semibold text-fg">
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (/^\*[^*]+\*$/.test(part)) {
        return (
          <Text key={i} style={{ fontStyle: 'italic' }}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        return (
          <Text key={i} className="text-primary underline" onPress={() => openUrl(link[2])}>
            {link[1]}
          </Text>
        );
      }
      return <Fragment key={i}>{part}</Fragment>;
    });
}

export function MarkdownText({ value }: { value: string }) {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const t = lines[i].trim();

    // Kode-hegn ```
    if (/^```/.test(t)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      i++; // spring afsluttende hegn over
      blocks.push(
        <View key={key++} className="rounded-lg bg-element px-3 py-2">
          <Text className="text-[13px] text-fg" style={{ fontFamily: 'monospace' }}>
            {buf.join('\n')}
          </Text>
        </View>,
      );
      continue;
    }

    if (t === '') {
      i++;
      continue;
    }

    // Overskrifter
    if (/^#{1,6}\s/.test(t)) {
      const level = (t.match(/^#+/) ?? ['#'])[0].length;
      blocks.push(
        <AppText key={key++} variant={level <= 2 ? 'heading' : 'label'}>
          {renderInline(t.replace(/^#+\s/, ''))}
        </AppText>,
      );
      i++;
      continue;
    }

    // Citat
    if (/^>\s?/.test(t)) {
      blocks.push(
        <View key={key++} className="border-l-2 border-border pl-3">
          <AppText variant="muted">{renderInline(t.replace(/^>\s?/, ''))}</AppText>
        </View>,
      );
      i++;
      continue;
    }

    // Vandret linje
    if (/^([-*_])\1{2,}$/.test(t)) {
      blocks.push(<View key={key++} className="my-1 border-t border-border" />);
      i++;
      continue;
    }

    // Punktliste
    if (/^[-*+]\s/.test(t)) {
      blocks.push(
        <View key={key++} className="flex-row gap-2">
          <AppText variant="muted">•</AppText>
          <AppText className="flex-1">{renderInline(t.replace(/^[-*+]\s/, ''))}</AppText>
        </View>,
      );
      i++;
      continue;
    }

    // Nummerliste
    const num = t.match(/^(\d+)\.\s(.*)/);
    if (num) {
      blocks.push(
        <View key={key++} className="flex-row gap-2">
          <AppText variant="muted">{num[1]}.</AppText>
          <AppText className="flex-1">{renderInline(num[2])}</AppText>
        </View>,
      );
      i++;
      continue;
    }

    // Afsnit
    blocks.push(<AppText key={key++}>{renderInline(t)}</AppText>);
    i++;
  }

  return <View className="gap-1.5">{blocks}</View>;
}
