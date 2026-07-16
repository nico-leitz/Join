import {
  CreateSubtask,
  SubtaskRow,
  UpdateSubtask,
} from '../models/subtask.model';
import { TaskAssignmentRow } from '../models/task-assignment.model';
import {
  CreateTask,
  TaskRow,
  UpdateTask,
} from '../models/task.model';

export function createTaskInsertPayload(
  task: CreateTask,
): Partial<TaskRow> {
  return {
    title: task.title.trim(),
    description: task.description?.trim() ?? '',
    due_date: task.dueDate,
    category: task.category,
    ...(task.priority !== undefined && { priority: task.priority }),
    ...(task.status !== undefined && { status: task.status }),
    ...(task.sortOrder !== undefined && { sort_order: task.sortOrder }),
  };
}

export function createTaskUpdatePayload(
  task: UpdateTask,
): Partial<TaskRow> {
  return {
    ...(task.title !== undefined && { title: task.title.trim() }),
    ...(task.description !== undefined && {
      description: task.description.trim(),
    }),
    ...(task.dueDate !== undefined && { due_date: task.dueDate }),
    ...(task.priority !== undefined && { priority: task.priority }),
    ...(task.category !== undefined && { category: task.category }),
    ...(task.status !== undefined && { status: task.status }),
    ...(task.sortOrder !== undefined && { sort_order: task.sortOrder }),
    updated_at: new Date().toISOString(),
  };
}

export function createSubtaskInsertPayload(
  subtask: CreateSubtask,
): Partial<SubtaskRow> {
  return {
    task_id: subtask.taskId,
    title: subtask.title.trim(),
    ...(subtask.sortOrder !== undefined && {
      sort_order: subtask.sortOrder,
    }),
  };
}

export function createSubtaskUpdatePayload(
  subtask: UpdateSubtask,
): Partial<SubtaskRow> {
  return {
    ...(subtask.title !== undefined && {
      title: subtask.title.trim(),
    }),
    ...(subtask.isCompleted !== undefined && {
      is_completed: subtask.isCompleted,
    }),
    ...(subtask.sortOrder !== undefined && {
      sort_order: subtask.sortOrder,
    }),
    updated_at: new Date().toISOString(),
  };
}

export function createTaskAssignmentRow(
  taskId: string,
  contactId: string,
): Partial<TaskAssignmentRow> {
  return {
    task_id: taskId,
    contact_id: contactId,
  };
}

export function createTaskAssignmentRows(
  taskId: string,
  contactIds: string[],
): Partial<TaskAssignmentRow>[] {
  return contactIds.map((contactId) => {
    return createTaskAssignmentRow(taskId, contactId);
  });
}