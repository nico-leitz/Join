import { CreateTask, UpdateTask } from './task.model';

/**
 * Represents a subtask submitted while creating a task.
 */
export interface CreateTaskSubtaskInput {
  /** Subtask title. */
  title: string;

  /** Optional position of the subtask within the task. */
  sortOrder?: number;
}

/**
 * Represents a subtask submitted while updating a task.
 */
export interface UpdateTaskSubtaskInput {
  /** Existing subtask identifier or undefined for a new subtask. */
  id?: string;

  /** Subtask title. */
  title: string;

  /** Optional completion state of the subtask. */
  isCompleted?: boolean;

  /** Optional position of the subtask within the task. */
  sortOrder?: number;
}

/**
 * Contains a task and its optional relations for persistence.
 */
export interface CreateTaskWithRelationsInput {
  /** Task data to create. */
  task: CreateTask;

  /** Subtasks to create for the task. */
  subtasks?: CreateTaskSubtaskInput[];

  /** Identifiers of the contacts assigned to the task. */
  contactIds?: string[];
}

/**
 * Contains task updates and optional relation updates for persistence.
 */
export interface UpdateTaskWithRelationsInput {
  /** Task fields to update. */
  task: UpdateTask;

  /** Complete submitted subtask state for the task. */
  subtasks?: UpdateTaskSubtaskInput[];

  /** Complete submitted contact assignment state for the task. */
  contactIds?: string[];
}