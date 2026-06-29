import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { Pressable, View } from '@/tw';
import { formatDuration, isOvernight } from '../time.utils';
import type { TimeEntry } from '../types';

export function TimeEntryRow({ entry }: { entry: WithId<TimeEntry> }) {
  const open = !entry.endTime;
  const overnight = !open && isOvernight(entry.startTime, entry.endTime ?? '');
  return (
    <Link href={{ pathname: '/timetracker/[id]', params: { id: entry.id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <AppText variant="label">{entry.category}</AppText>
            <AppText variant="muted">
              {open ? `fra ${entry.startTime} · mangler sluttid` : `${entry.startTime}–${entry.endTime}`}
              {overnight ? ' (+1)' : ''}
              {entry.description ? ` · ${entry.description}` : ''}
            </AppText>
          </View>
          {open ? (
            <AppText variant="label" className="text-accent-moving">
              ⚠ Tilføj slut
            </AppText>
          ) : (
            <AppText variant="label" className="text-accent-time">
              {formatDuration(entry.durationMinutes)}
            </AppText>
          )}
        </Card>
      </Pressable>
    </Link>
  );
}
