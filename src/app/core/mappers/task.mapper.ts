import { Contact, ContactRow } from '../models/contact.model';
import { Subtask, SubtaskRow } from '../models/subtask.model';
import { Task, TaskRow } from '../models/task.model';

/**
 * Represents a contact relation returned by a task assignment query.
 */
export interface TaskContactRelationRow {
  /** Related contact row or null when the relation cannot be resolved. */
  contacts: ContactRow | null;
}

/**
 * Maps task database rows to application task models.
 *
 * @param taskRows - Database rows to map.
 * @returns Mapped application task models.
 */
export function mapTaskRows(taskRows: TaskRow[]): Task[] {
  return taskRows.map((taskRow) => mapTaskRow(taskRow));
}

/**
 * Maps a task database row to an application task model.
 *
 * @param taskRow - Database row to map.
 * @returns Mapped application task.
 */
export function mapTaskRow(taskRow: TaskRow): Task {
  return {
    id: taskRow.id,
    title: taskRow.title,
    description: taskRow.description,
    dueDate: taskRow.due_date,
    priority: taskRow.priority,
    category: taskRow.category,
    status: taskRow.status,
    sortOrder: taskRow.sort_order,
    createdAt: taskRow.created_at,
    updatedAt: taskRow.updated_at,
  };
}

/**
 * Maps subtask database rows to application subtask models.
 *
 * @param subtaskRows - Database rows to map.
 * @returns Mapped application subtask models.
 */
export function mapSubtaskRows(subtaskRows: SubtaskRow[]): Subtask[] {
  return subtaskRows.map((subtaskRow) => mapSubtaskRow(subtaskRow));
}

/**
 * Maps a subtask database row to an application subtask model.
 *
 * @param subtaskRow - Database row to map.
 * @returns Mapped application subtask.
 */
export function mapSubtaskRow(subtaskRow: SubtaskRow): Subtask {
  return {
    id: subtaskRow.id,
    taskId: subtaskRow.task_id,
    title: subtaskRow.title,
    isCompleted: subtaskRow.is_completed,
    sortOrder: subtaskRow.sort_order,
    createdAt: subtaskRow.created_at,
    updatedAt: subtaskRow.updated_at,
  };
}

/**
 * Extracts and maps valid contacts from task assignment relations.
 *
 * @param relations - Contact relations returned by Supabase.
 * @returns Mapped contacts without unresolved relations.
 */
export function mapContactRelations(
  relations: TaskContactRelationRow[],
): Contact[] {
  return relations
    .map((relation) => relation.contacts)
    .filter((contact): contact is ContactRow => contact !== null)
    .map((contact) => mapContactRow(contact));
}

/**
 * Maps a contact database row to an application contact model.
 *
 * @param contactRow - Database row to map.
 * @returns Mapped application contact.
 */
function mapContactRow(contactRow: ContactRow): Contact {
  return {
    id: contactRow.id,
    firstName: contactRow.first_name,
    lastName: contactRow.last_name,
    email: contactRow.email,
    phone: contactRow.phone,
    badgeColor: contactRow.badge_color,
    authUserId: contactRow.auth_user_id,
    createdAt: contactRow.created_at,
    updatedAt: contactRow.updated_at,
  };
}