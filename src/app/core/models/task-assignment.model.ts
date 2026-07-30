/**
 * Represents a task assignment row returned by the database.
 */
export interface TaskAssignmentRow {
  /** Identifier of the assigned task. */
  task_id: string;

  /** Identifier of the assigned contact. */
  contact_id: string;

  /** ISO timestamp indicating when the assignment was created. */
  created_at: string;
}

/**
 * Represents a task-to-contact assignment within the application.
 */
export interface TaskAssignment {
  /** Identifier of the assigned task. */
  taskId: string;

  /** Identifier of the assigned contact. */
  contactId: string;

  /** ISO timestamp indicating when the assignment was created. */
  createdAt: string;
}

/**
 * Contains the data required to create a task assignment.
 */
export interface CreateTaskAssignment {
  /** Identifier of the task to assign. */
  taskId: string;

  /** Identifier of the contact assigned to the task. */
  contactId: string;
}