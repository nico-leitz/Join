import { TASK_STATUS_ORDER } from '../constants/task-status.constants';
import { Task, TaskPositionUpdate, TaskStatus } from '../models/task.model';

export interface TaskDropPosition {
  sourceStatus: TaskStatus;
  targetStatus: TaskStatus;
  sourceIndex: number;
  targetIndex: number;
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(compareTasks);
}

export function createDropTaskUpdates(
  tasks: Task[],
  position: TaskDropPosition,
): TaskPositionUpdate[] {
  const sourceTasks = getColumnTasks(tasks, position.sourceStatus);
  const movedTask = sourceTasks.at(position.sourceIndex);

  if (!movedTask) {
    return [];
  }

  sourceTasks.splice(position.sourceIndex, 1);

  if (position.sourceStatus === position.targetStatus) {
    insertTask(sourceTasks, movedTask, position.targetIndex);

    return createChangedPositions(
      tasks,
      sourceTasks,
      position.sourceStatus,
    );
  }

  const targetTasks = getColumnTasks(tasks, position.targetStatus);
  insertTask(targetTasks, movedTask, position.targetIndex);

  return createChangedPositionsForColumns(
    tasks,
    sourceTasks,
    targetTasks,
    position,
  );
}

export function createStatusMoveTaskUpdates(
  tasks: Task[],
  taskId: string,
  targetStatus: TaskStatus,
): TaskPositionUpdate[] {
  const movedTask = tasks.find((task) => task.id === taskId);

  if (!movedTask || movedTask.status === targetStatus) {
    return [];
  }

  const sourceTasks = getColumnTasks(tasks, movedTask.status).filter(
    (task) => task.id !== taskId,
  );
  const targetTasks = getColumnTasks(tasks, targetStatus);

  targetTasks.push(movedTask);

  return createChangedPositionsForColumns(
    tasks,
    sourceTasks,
    targetTasks,
    {
      sourceStatus: movedTask.status,
      targetStatus,
    },
  );
}

export function applyTaskPositionUpdates(
  tasks: Task[],
  updates: TaskPositionUpdate[],
): Task[] {
  const updatesById = new Map(
    updates.map((update) => [update.id, update]),
  );

  return sortTasks(
    tasks.map((task) => {
      const update = updatesById.get(task.id);
      return update ? { ...task, ...update } : task;
    }),
  );
}

function createChangedPositionsForColumns(
  tasks: Task[],
  sourceTasks: Task[],
  targetTasks: Task[],
  position: Pick<
    TaskDropPosition,
    'sourceStatus' | 'targetStatus'
  >,
): TaskPositionUpdate[] {
  return [
    ...createChangedPositions(
      tasks,
      sourceTasks,
      position.sourceStatus,
    ),
    ...createChangedPositions(
      tasks,
      targetTasks,
      position.targetStatus,
    ),
  ];
}

function createChangedPositions(
  currentTasks: Task[],
  orderedTasks: Task[],
  status: TaskStatus,
): TaskPositionUpdate[] {
  const currentById = new Map(
    currentTasks.map((task) => [task.id, task]),
  );

  return orderedTasks.flatMap((task, sortOrder) => {
    const currentTask = currentById.get(task.id);
    const hasChanged =
      currentTask?.status !== status ||
      currentTask.sortOrder !== sortOrder;

    return hasChanged
      ? [{ id: task.id, status, sortOrder }]
      : [];
  });
}

function getColumnTasks(
  tasks: Task[],
  status: TaskStatus,
): Task[] {
  return tasks
    .filter((task) => task.status === status)
    .sort(compareColumnTasks);
}

function insertTask(
  tasks: Task[],
  task: Task,
  requestedIndex: number,
): void {
  const targetIndex = Math.max(
    0,
    Math.min(requestedIndex, tasks.length),
  );

  tasks.splice(targetIndex, 0, task);
}

function compareTasks(
  firstTask: Task,
  secondTask: Task,
): number {
  return (
    TASK_STATUS_ORDER[firstTask.status] -
      TASK_STATUS_ORDER[secondTask.status] ||
    compareColumnTasks(firstTask, secondTask)
  );
}

function compareColumnTasks(
  firstTask: Task,
  secondTask: Task,
): number {
  return (
    firstTask.sortOrder - secondTask.sortOrder ||
    firstTask.createdAt.localeCompare(secondTask.createdAt) ||
    firstTask.id.localeCompare(secondTask.id)
  );
}