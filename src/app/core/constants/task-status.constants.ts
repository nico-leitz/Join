import { TaskStatus } from '../models/task.model';

/**
 * Represents a task status displayed as a selectable option.
 */
export interface TaskStatusOption {
  /** Status value stored in the application and database. */
  status: TaskStatus;

  /** Human-readable label displayed in the user interface. */
  label: string;
}

/**
 * Defines all available task statuses and their display labels.
 */
export const TASK_STATUS_OPTIONS: readonly TaskStatusOption[] = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'awaiting_feedback', label: 'Await feedback' },
  { status: 'done', label: 'Done' },
];

/**
 * Defines the board column order for each task status.
 */
export const TASK_STATUS_ORDER: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  awaiting_feedback: 2,
  done: 3,
};

/**
 * Checks whether a string represents a supported task status.
 * @param value - String value to validate.
 * @returns Whether the value is a valid task status.
 */
export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUS_OPTIONS.some((option) => option.status === value);
}