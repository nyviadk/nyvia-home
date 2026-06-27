import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { ExpandableText } from '@/components/ui/expandable-text';
import { MoneyText } from '@/components/ui/money-text';
import { AppText } from '@/components/ui/text';
import type { WithId } from '@/lib/firebase';
import { recurrenceLabel } from '@/lib/recurrence/label';
import { cn } from '@/lib/cn';
import { Pressable, View } from '@/tw';
import { entryCategories } from '../data/categories';
import type { BudgetEntry } from '../types';

export function BudgetEntryRow({ entry }: { entry: WithId<BudgetEntry> }) {
  return (
    <Card className="gap-2">
      <Link href={{ pathname: '/budget/[id]', params: { id: entry.id } }} asChild>
        <Pressable accessibilityRole="button" className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <AppText variant="label">{entry.name}</AppText>
            <AppText variant="muted">
              {entryCategories(entry).join(', ')} · {recurrenceLabel(entry.recurrence)}
              {entry.advanceMonth ? ' · forudløn' : ''}
            </AppText>
          </View>
          <MoneyText
            ore={entry.amount}
            whole
            variant="label"
            className={cn(entry.type === 'income' && 'text-accent-savings')}
          />
        </Pressable>
      </Link>
      {entry.note ? <ExpandableText text={entry.note} /> : null}
    </Card>
  );
}
