import { TaskStatus } from '../models/task.model';

export interface TaskStatusOption {
  status: TaskStatus;
  label: string;
}

export const TASK_STATUS_OPTIONS: readonly TaskStatusOption[] = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'awaiting_feedback', label: 'Await feedback' },
  { status: 'done', label: 'Done' },
];

export const TASK_STATUS_ORDER: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  awaiting_feedback: 2,
  done: 3,
};

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUS_OPTIONS.some((option) => option.status === value);
}
