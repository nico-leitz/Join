import { Contact } from '../../../core/models/contact.model';
import { Subtask } from '../../../core/models/subtask.model';
import { TaskAssignmentRow } from '../../../core/models/task-assignment.model';

export function groupSubtasksByTaskId(
  subtasks: Subtask[],
): Map<string, Subtask[]> {
  const groupedSubtasks = new Map<string, Subtask[]>();

  for (const subtask of subtasks) {
    const taskSubtasks = groupedSubtasks.get(subtask.taskId) ?? [];
    groupedSubtasks.set(subtask.taskId, [...taskSubtasks, subtask]);
  }

  return groupedSubtasks;
}

export function groupContactIdsByTaskId(
  assignments: TaskAssignmentRow[],
): Map<string, string[]> {
  const groupedContactIds = new Map<string, string[]>();

  for (const assignment of assignments) {
    const contactIds = groupedContactIds.get(assignment.task_id) ?? [];
    groupedContactIds.set(assignment.task_id, [
      ...contactIds,
      assignment.contact_id,
    ]);
  }

  return groupedContactIds;
}

export function createContactMap(contacts: Contact[]): Map<string, Contact> {
  return new Map(contacts.map((contact) => [contact.id, contact]));
}

export function replaceBoardSubtask(
  subtasks: Subtask[],
  updatedSubtask: Subtask,
): Subtask[] {
  return subtasks.map((subtask) => {
    return subtask.id === updatedSubtask.id ? updatedSubtask : subtask;
  });
}
