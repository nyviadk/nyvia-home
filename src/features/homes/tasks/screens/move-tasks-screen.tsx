import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { Pressable, View } from '@/tw';
import { QuickAddRow } from '../../components/quick-add-row';
import { TaskRow } from '../components/task-row';
import {
  createMoveTask,
  createMoveTasks,
  resetMoveTasks,
} from '../data/move-tasks.repository';
import { useMoveTasksStore } from '../data/move-tasks-store';
import { MOVE_TASK_PRESETS } from '../data/presets';

export function MoveTasksScreen() {
  const allTasks = useMoveTasksStore((s) => s.items);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  // Klarede opgaver synker til bunden; ellers order-rækkefølge.
  const tasks = [...allTasks].sort((a, b) =>
    a.done === b.done ? a.order - b.order : a.done ? 1 : -1
  );
  const doneCount = tasks.filter((t) => t.done).length;
  const canReset = tasks.some((t) => t.done);

  const existsByTitle = (t: string) =>
    tasks.some((x) => x.title.toLowerCase() === t.trim().toLowerCase());

  async function add() {
    const t = title.trim();
    if (!t) return;
    setTitle('');
    if (existsByTitle(t)) return;
    await createMoveTask({ title: t, done: false, order: Date.now() });
  }

  async function addPresets() {
    const toAdd = MOVE_TASK_PRESETS.filter((t) => !existsByTitle(t));
    if (toAdd.length === 0) return;
    setBusy(true);
    try {
      const base = Date.now();
      await createMoveTasks(
        toAdd.map((title, i) => ({ title, done: false, order: base + i }))
      );
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    const ok = await confirmAction(
      'Nulstil opgaver',
      'Sæt alle tilbage til ikke-klaret? Listen beholdes, så den kan genbruges til næste flytning.',
      'Nulstil'
    );
    if (ok) await resetMoveTasks(tasks.map((t) => t.id));
  }

  return (
    <Screen>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <AppText variant="title">Flytte-todo</AppText>
          <AppText variant="muted">
            {tasks.length > 0 ? `${doneCount} / ${tasks.length} klaret` : ''}
          </AppText>
        </View>
        {canReset ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onReset}>
            <AppText className="text-sm text-primary">Nulstil</AppText>
          </Pressable>
        ) : null}
      </View>

      <QuickAddRow value={title} onChangeText={setTitle} onAdd={add} placeholder="Ny opgave…" />

      {tasks.length === 0 ? (
        <>
          <EmptyState
            title="Ingen opgaver endnu"
            description="Tilføj dine egne, eller start med standard-listen til en flytning."
          />
          <Button
            title="Tilføj standard-opgaver"
            variant="secondary"
            loading={busy}
            onPress={addPresets}
          />
        </>
      ) : (
        <View className="gap-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </View>
      )}
    </Screen>
  );
}
