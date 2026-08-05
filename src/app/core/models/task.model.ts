/**
 * Defines the supported task priority levels.
 */
export type TaskPriority = 'urgent' | 'medium' | 'low';

/**
 * Defines the supported task categories.
 */
export type TaskCategory = 'technical_task' | 'user_story';

/**
 * Defines the supported task workflow states.
 */
export type TaskStatus = 'todo' | 'in_progress' | 'awaiting_feedback' | 'done';

/**
 * Represents a task row returned by the database.
 */
export interface TaskRow {
  /** Unique task identifier. */
  id: string;

  /** Task title. */
  title: string;

  /** Detailed task description. */
  description: string;

  /** Due date stored by the database. */
  due_date: string;

  /** Priority assigned to the task. */
  priority: TaskPriority;

  /** Category assigned to the task. */
  category: TaskCategory;

  /** Current workflow status of the task. */
  status: TaskStatus;

  /** Position of the task within its board column. */
  sort_order: number;

  /** ISO timestamp indicating when the task was created. */
  created_at: string;

  /** ISO timestamp indicating when the task was last updated. */
  updated_at: string;
}

/**
 * Represents a task within the application.
 */
export interface Task {
  /** Unique task identifier. */
  id: string;

  /** Task title. */
  title: string;

  /** Detailed task description. */
  description: string;

  /** Due date of the task. */
  dueDate: string;

  /** Priority assigned to the task. */
  priority: TaskPriority;

  /** Category assigned to the task. */
  category: TaskCategory;

  /** Current workflow status of the task. */
  status: TaskStatus;

  /** Position of the task within its board column. */
  sortOrder: number;

  /** ISO timestamp indicating when the task was created. */
  createdAt: string;

  /** ISO timestamp indicating when the task was last updated. */
  updatedAt: string;
}

/**
 * Represents a persisted board position change.
 */
export interface TaskPositionUpdate {
  /** Identifier of the task to reposition. */
  id: string;

  /** Destination workflow status. */
  status: TaskStatus;

  /** New position within the destination column. */
  sortOrder: number;
}

/**
 * Contains the data required to create a task.
 */
export interface CreateTask {
  /** Task title. */
  title: string;

  /** Optional detailed task description. */
  description?: string;

  /** Due date of the task. */
  dueDate: string;

  /** Optional priority or the database default when omitted. */
  priority?: TaskPriority;

  /** Category assigned to the task. */
  category: TaskCategory;

  /** Optional initial workflow status. */
  status?: TaskStatus;

  /** Optional initial position within the board column. */
  sortOrder?: number;
}

/**
 * Contains the task fields that can be updated.
 */
export interface UpdateTask {
  /** Updated task title. */
  title?: string;

  /** Updated task description. */
  description?: string;

  /** Updated task due date. */
  dueDate?: string;

  /** Updated task priority. */
  priority?: TaskPriority;

  /** Updated task category. */
  category?: TaskCategory;

  /** Updated workflow status. */
  status?: TaskStatus;

  /** Updated position within the board column. */
  sortOrder?: number;
}