import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { Pressable, Text, View } from '@/tw';
import { type Home, type HomeStatus, homeLocation } from '../types';

const STATUS: Record<HomeStatus, { label: string; box: string; text: string }> = {
  kommende: { label: 'Kommende', box: 'bg-accent-budget/15', text: 'text-accent-budget' },
  nuværende: { label: 'Nuværende', box: 'bg-accent-savings/15', text: 'text-accent-savings' },
  tidligere: { label: 'Tidligere', box: 'bg-element', text: 'text-fg-muted' },
};

export function HomeCard({ home }: { home: WithId<Home> }) {
  const location = homeLocation(home);
  const status = STATUS[home.status];
  return (
    <Link href={{ pathname: '/homes/[id]', params: { id: home.id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card className="flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <AppText variant="label">{home.address}</AppText>
            {location ? <AppText variant="muted">{location}</AppText> : null}
          </View>
          <View className={cn('rounded-full px-2.5 py-1', status.box)}>
            <Text className={cn('text-xs font-medium', status.text)}>{status.label}</Text>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
