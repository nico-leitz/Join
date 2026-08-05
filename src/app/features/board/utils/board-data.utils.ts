import { Contact } from '../../../core/models/contact.model';
import { Subtask } from '../../../core/models/subtask.model';
import { TaskAssignmentRow } from '../../../core/models/task-assignment.model';

/**
 * Groups subtasks by their parent task identifier.
 * @param subtasks - Subtasks to group.
 * @returns Map containing one ordered subtask collection per task.
 */
export function groupSubtasksByTaskId(subtasks: Subtask[]): Map<string, Subtask[]> {
  const groupedSubtasks = new Map<string, Subtask[]>();
  for (const subtask of subtasks) {
    const taskSubtasks = groupedSubtasks.get(subtask.taskId);
    if (taskSubtasks) {
      taskSubtasks.push(subtask);
    } else {
      groupedSubtasks.set(subtask.taskId, [subtask]);
    }
  }
  return groupedSubtasks;
}

/**
 * Groups assigned contact identifiers by task identifier.
 * @param assignments - Persisted task assignment rows to group.
 * @returns Map containing one ordered contact identifier collection per task.
 */
export function groupContactIdsByTaskId(assignments: TaskAssignmentRow[]): Map<string, string[]> {
  const groupedContactIds = new Map<string, string[]>();
  for (const assignment of assignments) {
    const contactIds = groupedContactIds.get(assignment.task_id);
    if (contactIds) {
      contactIds.push(assignment.contact_id);
    } else {
      groupedContactIds.set(assignment.task_id, [assignment.contact_id]);
    }
  }
  return groupedContactIds;
}

/**
 * Indexes contacts by their identifier.
 * @param contacts - Contacts to index.
 * @returns Map containing each contact under its identifier.
 */
export function createContactMap(contacts: Contact[]): Map<string, Contact> {
  return new Map(contacts.map((contact) => [contact.id, contact]));
}

/**
 * Replaces a subtask by identifier without mutating the source collection.
 * @param subtasks - Current board subtask collection.
 * @param updatedSubtask - Subtask containing the replacement state.
 * @returns Subtask collection containing the replacement.
 */
export function replaceBoardSubtask(subtasks: Subtask[], updatedSubtask: Subtask): Subtask[] {
  return subtasks.map((subtask) => (subtask.id === updatedSubtask.id ? updatedSubtask : subtask));
}