import { TASK_STATUS_ORDER } from '../constants/task-status.constants';
import {
  Task,
  TaskPositionUpdate,
  TaskStatus,
} from '../models/task.model';

/**
 * Describes the source and target position of a dragged task.
 */
export interface TaskDropPosition {
  /** Status of the source board column. */
  sourceStatus: TaskStatus;

  /** Status of the target board column. */
  targetStatus: TaskStatus;

  /** Original task index within the source column. */
  sourceIndex: number;

  /** Requested task index within the target column. */
  targetIndex: number;
}

/**
 * Returns tasks ordered by board column and column position.
 *
 * @param tasks - Tasks to sort.
 * @returns Sorted copy of the task collection.
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(compareTasks);
}

/**
 * Creates the required position updates for a drag-and-drop operation.
 *
 * @param tasks - Complete current task collection.
 * @param position - Source and target drop position.
 * @returns Changed task positions or an empty collection for an invalid source.
 */
export function createDropTaskUpdates(
  tasks: Task[],
  position: TaskDropPosition,
): TaskPositionUpdate[] {
  const sourceTasks = getColumnTasks(
    tasks,
    position.sourceStatus,
  );
  const movedTask = sourceTasks[position.sourceIndex];

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

  const targetTasks = getColumnTasks(
    tasks,
    position.targetStatus,
  );
  insertTask(targetTasks, movedTask, position.targetIndex);

  return createChangedPositionsForColumns(
    tasks,
    sourceTasks,
    targetTasks,
    position,
  );
}

/**
 * Creates updates that move a task to the end of another status column.
 *
 * @param tasks - Complete current task collection.
 * @param taskId - Identifier of the task to move.
 * @param targetStatus - Status of the target column.
 * @returns Changed task positions or an empty collection for a no-op.
 */
export function createStatusMoveTaskUpdates(
  tasks: Task[],
  taskId: string,
  targetStatus: TaskStatus,
): TaskPositionUpdate[] {
  const movedTask = tasks.find((task) => {
    return task.id === taskId;
  });

  if (!movedTask || movedTask.status === targetStatus) {
    return [];
  }

  const sourceTasks = getColumnTasks(
    tasks,
    movedTask.status,
  ).filter((task) => {
    return task.id !== taskId;
  });
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

/**
 * Applies persisted position updates and restores board sort order.
 *
 * @param tasks - Current task collection.
 * @param updates - Position updates to apply.
 * @returns Updated and sorted task collection.
 */
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
      return update
        ? { ...task, ...update }
        : task;
    }),
  );
}

/**
 * Creates changed positions for two affected board columns.
 *
 * @param tasks - Complete current task collection.
 * @param sourceTasks - Ordered tasks remaining in the source column.
 * @param targetTasks - Ordered tasks in the target column.
 * @param position - Source and target statuses.
 * @returns Combined position updates for both columns.
 */
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

/**
 * Creates updates for tasks whose status or sort order changed.
 *
 * @param currentTasks - Complete current task collection.
 * @param orderedTasks - Tasks in their requested column order.
 * @param status - Status assigned to the ordered tasks.
 * @returns Required position updates.
 */
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
      !currentTask ||
      currentTask.status !== status ||
      currentTask.sortOrder !== sortOrder;

    return hasChanged
      ? [{ id: task.id, status, sortOrder }]
      : [];
  });
}

/**
 * Returns the sorted tasks belonging to a board column.
 *
 * @param tasks - Complete task collection.
 * @param status - Status of the requested column.
 * @returns Sorted tasks belonging to the column.
 */
function getColumnTasks(
  tasks: Task[],
  status: TaskStatus,
): Task[] {
  return tasks
    .filter((task) => task.status === status)
    .sort(compareColumnTasks);
}

/**
 * Inserts a task at a position constrained to the collection boundaries.
 *
 * @param tasks - Target task collection.
 * @param task - Task to insert.
 * @param requestedIndex - Requested insertion index.
 */
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

/**
 * Compares tasks by board column and their position inside the column.
 *
 * @param firstTask - First task to compare.
 * @param secondTask - Second task to compare.
 * @returns Numeric comparison result.
 */
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

/**
 * Compares tasks by sort order, creation time and identifier.
 *
 * @param firstTask - First task to compare.
 * @param secondTask - Second task to compare.
 * @returns Numeric comparison result.
 */
function compareColumnTasks(
  firstTask: Task,
  secondTask: Task,
): number {
  return (
    firstTask.sortOrder - secondTask.sortOrder ||
    firstTask.createdAt.localeCompare(
      secondTask.createdAt,
    ) ||
    firstTask.id.localeCompare(secondTask.id)
  );
}