/** En flytte-opgave knyttet til en bolig (homeId). */
export type MoveTask = {
  homeId: string;
  title: string;
  done: boolean;
  dueDate?: string;
  notes?: string;
  /** Sorteringsnøgle (stigende). */
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type MoveTaskInput = Pick<MoveTask, 'homeId' | 'title' | 'done' | 'order' | 'dueDate' | 'notes'>;
