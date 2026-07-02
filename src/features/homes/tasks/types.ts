/** En global flytte-opgave (ikke bundet til en bestemt bolig — genbruges pr. flytning). */
export type MoveTask = {
  title: string;
  done: boolean;
  dueDate?: string;
  notes?: string;
  /** Sorteringsnøgle (stigende). */
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type MoveTaskInput = Pick<MoveTask, 'title' | 'done' | 'order' | 'dueDate' | 'notes'>;
