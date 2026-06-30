import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { QuickAddRow } from '../../components/quick-add-row';
import { useHomesStore } from '../../data/homes-store';
import { TaskRow } from '../components/task-row';
import { createMoveTask, createMoveTasks } from '../data/move-tasks.repository';
import { useMoveTasksStore } from '../data/move-tasks-store';
import { MOVE_TASK_PRESETS } from '../data/presets';

export function MoveTasksScreen() {
  const { id: homeId } = useLocalSearchParams<{ id: string }>();
  const home = useHomesStore((s) => s.items.find((h) => h.id === homeId));
  const allTasks = useMoveTasksStore((s) => s.items);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const tasks = allTasks
    .filter((t) => t.homeId === homeId)
    .sort((a, b) => (a.done === b.done ? a.order - b.order : a.done ? 1 : -1));
  const doneCount = tasks.filter((t) => t.done).length;

  async function add() {
    const t = title.trim();
    if (!t || !homeId) return;
    setTitle('');
    await createMoveTask({ homeId, title: t, done: false, order: Date.now() });
  }

  async function addPresets() {
    if (!homeId) return;
    setBusy(true);
    try {
      const base = Date.now();
      await createMoveTasks(
        MOVE_TASK_PRESETS.map((title, i) => ({ homeId, title, done: false, order: base + i }))
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View className="gap-0.5">
        <AppText variant="title">Flytte-todo</AppText>
        {home ? <AppText variant="muted">{home.address}</AppText> : null}
        {tasks.length > 0 ? (
          <AppText variant="muted">
            {doneCount} / {tasks.length} klaret
          </AppText>
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
