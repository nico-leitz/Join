import { Subtask } from '../models/subtask.model';
import { Task } from '../models/task.model';
import { sortTasks } from './task-order.utils';

export { sortTasks } from './task-order.utils';

export function sortSubtasks(subtasks: Subtask[]): Subtask[] {
  return [...subtasks].sort((firstSubtask, secondSubtask) => {
    return (
      firstSubtask.sortOrder - secondSubtask.sortOrder ||
      firstSubtask.createdAt.localeCompare(secondSubtask.createdAt)
    );
  });
}

export function replaceTask(tasks: Task[], updatedTask: Task): Task[] {
  const updatedTasks = tasks.map((task) => {
    return task.id === updatedTask.id ? updatedTask : task;
  });

  return sortTasks(updatedTasks);
}

export function replaceSubtask(
  subtasks: Subtask[],
  updatedSubtask: Subtask,
): Subtask[] {
  const updatedSubtasks = subtasks.map((subtask) => {
    return subtask.id === updatedSubtask.id ? updatedSubtask : subtask;
  });

  return sortSubtasks(updatedSubtasks);
}

export function getUniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

export function getMissingIds(
  sourceIds: string[],
  comparisonIds: string[],
): string[] {
  return sourceIds.filter((id) => !comparisonIds.includes(id));
}
