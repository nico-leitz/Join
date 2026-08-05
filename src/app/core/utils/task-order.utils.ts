import { TASK_STATUS_ORDER } from '../constants/task-status.constants';
import { Task, TaskPositionUpdate, TaskStatus } from '../models/task.model';

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

/** Describes the affected columns of a task move. */
type TaskColumnTransition = Pick<TaskDropPosition, 'sourceStatus' | 'targetStatus'>;

/** Maps task identifiers to their requested position updates. */
type TaskUpdateMap = ReadonlyMap<string, TaskPositionUpdate>;

/**
 * Returns tasks ordered by board column and column position.
 * @param tasks - Tasks to sort.
 * @returns Sorted copy of the task collection.
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(compareTasks);
}

/**
 * Creates the required position updates for a drag-and-drop operation.
 * @param tasks - Complete current task collection.
 * @param position - Source and target drop position.
 * @returns Changed task positions or an empty collection for an invalid source.
 */
export function createDropTaskUpdates(
  tasks: Task[],
  position: TaskDropPosition,
): TaskPositionUpdate[] {
  const sourceTasks = getColumnTasks(tasks, position.sourceStatus);
  const movedTask = sourceTasks[position.sourceIndex];
  if (!movedTask) {
    return [];
  }
  sourceTasks.splice(position.sourceIndex, 1);
  return position.sourceStatus === position.targetStatus
    ? createSameColumnDropUpdates(tasks, sourceTasks, movedTask, position)
    : createCrossColumnDropUpdates(tasks, sourceTasks, movedTask, position);
}

/**
 * Creates updates that move a task to the end of another status column.
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
  const movedTask = tasks.find((task) => task.id === taskId);
  if (!movedTask || movedTask.status === targetStatus) {
    return [];
  }
  return createStatusMoveUpdates(tasks, movedTask, targetStatus);
}

/**
 * Applies persisted position updates and restores board sort order.
 * @param tasks - Current task collection.
 * @param updates - Position updates to apply.
 * @returns Updated and sorted task collection.
 */
export function applyTaskPositionUpdates(tasks: Task[], updates: TaskPositionUpdate[]): Task[] {
  const updatesById = new Map(updates.map((update) => [update.id, update]));
  return sortTasks(tasks.map((task) => applyPositionUpdate(task, updatesById)));
}

/**
 * Creates updates for a task reordered inside its current column.
 * @param tasks - Complete current task collection.
 * @param sourceTasks - Ordered tasks from the source column.
 * @param movedTask - Task being moved.
 * @param position - Requested drop position.
 * @returns Required position updates for the source column.
 */
function createSameColumnDropUpdates(
  tasks: Task[],
  sourceTasks: Task[],
  movedTask: Task,
  position: TaskDropPosition,
): TaskPositionUpdate[] {
  insertTask(sourceTasks, movedTask, position.targetIndex);
  return getColumnUpdates(tasks, sourceTasks, position.sourceStatus);
}

/**
 * Creates updates for a task moved into another column.
 * @param tasks - Complete current task collection.
 * @param sourceTasks - Ordered tasks remaining in the source column.
 * @param movedTask - Task being moved.
 * @param position - Requested drop position.
 * @returns Required position updates for both affected columns.
 */
function createCrossColumnDropUpdates(
  tasks: Task[],
  sourceTasks: Task[],
  movedTask: Task,
  position: TaskDropPosition,
): TaskPositionUpdate[] {
  const targetTasks = getColumnTasks(tasks, position.targetStatus);
  insertTask(targetTasks, movedTask, position.targetIndex);
  return createChangedPositionsForColumns(tasks, sourceTasks, targetTasks, position);
}

/**
 * Creates updates for a task appended to another column.
 * @param tasks - Complete current task collection.
 * @param movedTask - Task being moved.
 * @param targetStatus - Status of the target column.
 * @returns Required position updates for both affected columns.
 */
function createStatusMoveUpdates(
  tasks: Task[],
  movedTask: Task,
  targetStatus: TaskStatus,
): TaskPositionUpdate[] {
  const sourceTasks = withoutTask(tasks, movedTask.status, movedTask.id);
  const targetTasks = appendToColumn(tasks, targetStatus, movedTask);
  const position = { sourceStatus: movedTask.status, targetStatus };
  return createChangedPositionsForColumns(tasks, sourceTasks, targetTasks, position);
}

/**
 * Applies a matching position update to a task.
 * @param task - Task to update.
 * @param updatesById - Available updates indexed by task identifier.
 * @returns Updated task or the unchanged original task.
 */
function applyPositionUpdate(task: Task, updatesById: TaskUpdateMap): Task {
  const update = updatesById.get(task.id);
  return update ? { ...task, ...update } : task;
}

/**
 * Creates changed positions for two affected board columns.
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
  position: TaskColumnTransition,
): TaskPositionUpdate[] {
  const sourceUpdates = getColumnUpdates(tasks, sourceTasks, position.sourceStatus);
  const targetUpdates = getColumnUpdates(tasks, targetTasks, position.targetStatus);
  return sourceUpdates.concat(targetUpdates);
}

/**
 * Creates updates for tasks whose status or sort order changed.
 * @param currentTasks - Complete current task collection.
 * @param orderedTasks - Tasks in their requested column order.
 * @param status - Status assigned to the ordered tasks.
 * @returns Required position updates.
 */
function getColumnUpdates(
  currentTasks: Task[],
  orderedTasks: Task[],
  status: TaskStatus,
): TaskPositionUpdate[] {
  const currentById = new Map(currentTasks.map((task) => [task.id, task]));
  return orderedTasks.flatMap((task, sortOrder) =>
    createTaskPositionUpdate(currentById, task, status, sortOrder),
  );
}

/**
 * Creates a position update when the requested task position changed.
 * @param currentById - Current tasks indexed by identifier.
 * @param task - Task to compare.
 * @param status - Requested task status.
 * @param sortOrder - Requested task position.
 * @returns A position update or an empty collection for an unchanged task.
 */
function createTaskPositionUpdate(
  currentById: ReadonlyMap<string, Task>,
  task: Task,
  status: TaskStatus,
  sortOrder: number,
): TaskPositionUpdate[] {
  const currentTask = currentById.get(task.id);
  if (!hasTaskPositionChanged(currentTask, status, sortOrder)) {
    return [];
  }
  return [{ id: task.id, status, sortOrder }];
}

/**
 * Checks whether a task differs from a requested board position.
 * @param task - Current task or undefined for a missing task.
 * @param status - Requested task status.
 * @param sortOrder - Requested task position.
 * @returns Whether the task position changed.
 */
function hasTaskPositionChanged(
  task: Task | undefined,
  status: TaskStatus,
  sortOrder: number,
): boolean {
  return !task || task.status !== status || task.sortOrder !== sortOrder;
}

/**
 * Returns the sorted tasks belonging to a board column.
 * @param tasks - Complete task collection.
 * @param status - Status of the requested column.
 * @returns Sorted tasks belonging to the column.
 */
function getColumnTasks(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task) => task.status === status).sort(compareColumnTasks);
}

/**
 * Returns ordered column tasks without a specific task.
 * @param tasks - Complete task collection.
 * @param status - Status of the requested column.
 * @param taskId - Identifier of the task to exclude.
 * @returns Ordered tasks without the excluded task.
 */
function withoutTask(tasks: Task[], status: TaskStatus, taskId: string): Task[] {
  return getColumnTasks(tasks, status).filter((task) => task.id !== taskId);
}

/**
 * Returns ordered column tasks with a task appended.
 * @param tasks - Complete task collection.
 * @param status - Status of the requested column.
 * @param task - Task to append.
 * @returns Ordered tasks including the appended task.
 */
function appendToColumn(tasks: Task[], status: TaskStatus, task: Task): Task[] {
  const columnTasks = getColumnTasks(tasks, status);
  columnTasks.push(task);
  return columnTasks;
}

/**
 * Inserts a task at a position constrained to the collection boundaries.
 * @param tasks - Target task collection.
 * @param task - Task to insert.
 * @param requestedIndex - Requested insertion index.
 */
function insertTask(tasks: Task[], task: Task, requestedIndex: number): void {
  const targetIndex = Math.max(0, Math.min(requestedIndex, tasks.length));

  tasks.splice(targetIndex, 0, task);
}

/**
 * Compares tasks by board column and their position inside the column.
 * @param firstTask - First task to compare.
 * @param secondTask - Second task to compare.
 * @returns Numeric comparison result.
 */
function compareTasks(firstTask: Task, secondTask: Task): number {
  return (
    TASK_STATUS_ORDER[firstTask.status] - TASK_STATUS_ORDER[secondTask.status] ||
    compareColumnTasks(firstTask, secondTask)
  );
}

/**
 * Compares tasks by sort order, creation time and identifier.
 * @param firstTask - First task to compare.
 * @param secondTask - Second task to compare.
 * @returns Numeric comparison result.
 */
function compareColumnTasks(firstTask: Task, secondTask: Task): number {
  return (
    firstTask.sortOrder - secondTask.sortOrder ||
    firstTask.createdAt.localeCompare(secondTask.createdAt) ||
    firstTask.id.localeCompare(secondTask.id)
  );
}