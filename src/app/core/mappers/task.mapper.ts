import { Contact, ContactRow } from '../models/contact.model';
import { Subtask, SubtaskRow } from '../models/subtask.model';
import { Task, TaskRow } from '../models/task.model';

export interface TaskContactRelationRow {
  contacts: ContactRow | null;
}

export function mapTaskRows(taskRows: TaskRow[]): Task[] {
  return taskRows.map((taskRow) => mapTaskRow(taskRow));
}

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

export function mapSubtaskRows(subtaskRows: SubtaskRow[]): Subtask[] {
  return subtaskRows.map((subtaskRow) => mapSubtaskRow(subtaskRow));
}

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

export function mapContactRelations(
  relations: TaskContactRelationRow[],
): Contact[] {
  return relations
    .map((relation) => relation.contacts)
    .filter((contact): contact is ContactRow => contact !== null)
    .map((contact) => mapContactRow(contact));
}

function mapContactRow(contactRow: ContactRow): Contact {
  return {
    id: contactRow.id,
    firstName: contactRow.first_name,
    lastName: contactRow.last_name,
    email: contactRow.email,
    phone: contactRow.phone,
    badgeColor: contactRow.badge_color,
    createdAt: contactRow.created_at,
    updatedAt: contactRow.updated_at,
  };
}