import { Subtask } from '../models/subtask.model';

export interface SubtaskProgress {
  completed: number;
  total: number;
  percentage: number;
}

export function calculateSubtaskProgress(
  subtasks: Subtask[],
): SubtaskProgress {
  const total = subtasks.length;
  const completed = countCompletedSubtasks(subtasks);

  return {
    completed,
    total,
    percentage: calculatePercentage(completed, total),
  };
}

function countCompletedSubtasks(
  subtasks: Subtask[],
): number {
  return subtasks.filter((subtask) => {
    return subtask.isCompleted;
  }).length;
}

function calculatePercentage(
  completed: number,
  total: number,
): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}