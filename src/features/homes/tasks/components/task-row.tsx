import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { WithId } from '@/lib/firebase';
import { Pressable, Text, View } from '@/tw';
import { deleteMoveTask, setMoveTaskDone } from '../data/move-tasks.repository';
import type { MoveTask } from '../types';

export function TaskRow({ task }: { task: WithId<MoveTask> }) {
  const toggle = () => setMoveTaskDone(task.id, !task.done);
  return (
    <Card className={cn('flex-row items-center gap-3', task.done && 'opacity-60')}>
      <Pressable accessibilityRole="checkbox" onPress={toggle} hitSlop={8}>
        <View
          className={cn(
            'h-6 w-6 items-center justify-center rounded-md border',
            task.done ? 'border-primary bg-primary' : 'border-border'
          )}>
          {task.done ? <Text className="text-xs text-on-primary">✓</Text> : null}
        </View>
      </Pressable>
      <Pressable className="flex-1" accessibilityRole="button" onPress={toggle}>
        <AppText variant="label" className={cn(task.done && 'text-fg-muted line-through')}>
          {task.title}
        </AppText>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => deleteMoveTask(task.id)} hitSlop={8}>
        <AppText className="text-sm text-danger">Slet</AppText>
      </Pressable>
    </Card>
  );
}
