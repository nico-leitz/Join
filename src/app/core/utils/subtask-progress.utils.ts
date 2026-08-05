import { Subtask } from '../models/subtask.model';

/**
 * Describes the completion state of a subtask collection.
 */
export interface SubtaskProgress {
  /** Number of completed subtasks. */
  completed: number;

  /** Total number of subtasks. */
  total: number;

  /** Rounded completion percentage between zero and one hundred. */
  percentage: number;
}

/**
 * Calculates the completion progress of a subtask collection.
 * @param subtasks - Subtasks to evaluate.
 * @returns Completed count, total count and completion percentage.
 */
export function calculateSubtaskProgress(subtasks: Subtask[]): SubtaskProgress {
  const total = subtasks.length;
  const completed = countCompletedSubtasks(subtasks);

  return {
    completed,
    total,
    percentage: calculatePercentage(completed, total),
  };
}

/**
 * Counts completed subtasks within a collection.
 * @param subtasks - Subtasks to evaluate.
 * @returns Number of completed subtasks.
 */
function countCompletedSubtasks(subtasks: Subtask[]): number {
  return subtasks.filter((subtask) => {
    return subtask.isCompleted;
  }).length;
}

/**
 * Calculates a rounded percentage from completed and total values.
 * @param completed - Number of completed entries.
 * @param total - Total number of entries.
 * @returns Rounded percentage or zero when the total is zero.
 */
function calculatePercentage(completed: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}