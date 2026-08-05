import { Subtask } from '../models/subtask.model';
import { Task } from '../models/task.model';
import { sortTasks } from './task-order.utils';

export { sortTasks } from './task-order.utils';

/**
 * Compares two subtasks by display order, creation time, and identifier.
 * @param firstSubtask - First subtask to compare.
 * @param secondSubtask - Second subtask to compare.
 * @returns Negative, positive, or zero comparison result.
 */
function compareSubtasks(firstSubtask: Subtask, secondSubtask: Subtask): number {
  return (
    firstSubtask.sortOrder - secondSubtask.sortOrder ||
    firstSubtask.createdAt.localeCompare(secondSubtask.createdAt) ||
    firstSubtask.id.localeCompare(secondSubtask.id)
  );
}

/**
 * Returns a copy of a subtask collection in its resolved display order.
 * @param subtasks - Subtasks to sort.
 * @returns Sorted subtask collection.
 */
export function sortSubtasks(subtasks: Subtask[]): Subtask[] {
  return [...subtasks].sort(compareSubtasks);
}

/**
 * Replaces a task by identifier and restores board sort order.
 * @param tasks - Current task collection.
 * @param updatedTask - Task containing the replacement values.
 * @returns Updated and sorted task collection.
 */
export function replaceTask(tasks: Task[], updatedTask: Task): Task[] {
  const updatedTasks = tasks.map((task) => {
    return task.id === updatedTask.id ? updatedTask : task;
  });

  return sortTasks(updatedTasks);
}

/**
 * Replaces a subtask by identifier and restores subtask sort order.
 * @param subtasks - Current subtask collection.
 * @param updatedSubtask - Subtask containing the replacement values.
 * @returns Updated and sorted subtask collection.
 */
export function replaceSubtask(subtasks: Subtask[], updatedSubtask: Subtask): Subtask[] {
  const updatedSubtasks = subtasks.map((subtask) => {
    return subtask.id === updatedSubtask.id ? updatedSubtask : subtask;
  });

  return sortSubtasks(updatedSubtasks);
}

/**
 * Removes duplicate identifiers while preserving their original order.
 * @param ids - Identifiers to normalize.
 * @returns Unique identifiers.
 */
export function getUniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

/**
 * Returns identifiers that do not exist in the comparison collection.
 * @param sourceIds - Identifiers to inspect.
 * @param comparisonIds - Identifiers considered present.
 * @returns Source identifiers missing from the comparison collection.
 */
export function getMissingIds(sourceIds: string[], comparisonIds: string[]): string[] {
  const comparisonIdSet = new Set(comparisonIds);

  return sourceIds.filter((id) => {
    return !comparisonIdSet.has(id);
  });
}