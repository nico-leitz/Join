/**
 * Represents a subtask row returned by the database.
 */
export interface SubtaskRow {
  /** Unique subtask identifier. */
  id: string;

  /** Identifier of the task containing the subtask. */
  task_id: string;

  /** Subtask title. */
  title: string;

  /** Indicates whether the subtask is completed. */
  is_completed: boolean;

  /** Position of the subtask within its task. */
  sort_order: number;

  /** ISO timestamp indicating when the subtask was created. */
  created_at: string;

  /** ISO timestamp indicating when the subtask was last updated. */
  updated_at: string;
}

/**
 * Represents a subtask within the application.
 */
export interface Subtask {
  /** Unique subtask identifier. */
  id: string;

  /** Identifier of the task containing the subtask. */
  taskId: string;

  /** Subtask title. */
  title: string;

  /** Indicates whether the subtask is completed. */
  isCompleted: boolean;

  /** Position of the subtask within its task. */
  sortOrder: number;

  /** ISO timestamp indicating when the subtask was created. */
  createdAt: string;

  /** ISO timestamp indicating when the subtask was last updated. */
  updatedAt: string;
}

/**
 * Contains the data required to create a subtask.
 */
export interface CreateSubtask {
  /** Identifier of the task that will contain the subtask. */
  taskId: string;

  /** Subtask title. */
  title: string;

  /** Optional position of the subtask within its task. */
  sortOrder?: number;
}

/**
 * Contains the subtask fields that can be updated.
 */
export interface UpdateSubtask {
  /** Updated subtask title. */
  title?: string;

  /** Updated completion state. */
  isCompleted?: boolean;

  /** Updated position within the task. */
  sortOrder?: number;
}