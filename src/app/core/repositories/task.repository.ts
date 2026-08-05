import { Injectable, inject } from '@angular/core';
import { Contact } from '../models/contact.model';
import { CreateSubtask, SubtaskRow, UpdateSubtask } from '../models/subtask.model';
import { TaskAssignmentRow } from '../models/task-assignment.model';
import { CreateTask, TaskPositionUpdate, TaskRow, UpdateTask } from '../models/task.model';
import { createTaskInsertPayload, createTaskUpdatePayload } from '../mappers/task-payload.mapper';
import { SupabaseService } from '../supabase/supabase';
import { SubtaskRepository } from './subtask.repository';
import { TaskAssignmentRepository } from './task-assignment.repository';

/**
 * Provides persistence operations for tasks and delegates related data access.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskRepository {
  /** Name of the task database table. */
  private readonly taskTableName = 'tasks';

  /** Supabase client used for task persistence requests. */
  private readonly supabase = inject(SupabaseService).client;

  /** Repository used for subtask persistence requests. */
  private readonly subtasks = inject(SubtaskRepository);

  /** Repository used for assignment persistence requests. */
  private readonly assignments = inject(TaskAssignmentRepository);

  /**
   * Retrieves all task rows in their board order.
   * @returns Task rows ordered by position and creation time.
   * @throws The database error returned by Supabase.
   */
  async getTaskRows(): Promise<TaskRow[]> {
    const { data, error } = await this.supabase
      .from(this.taskTableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    this.throwIfError(error);
    return (data ?? []) as TaskRow[];
  }

  /**
   * Retrieves a single task row by its identifier.
   * @param id - Identifier of the requested task.
   * @returns Matching task row or null when the task does not exist.
   * @throws The database error returned by Supabase.
   */
  async getTaskRowById(id: string): Promise<TaskRow | null> {
    const { data, error } = await this.supabase
      .from(this.taskTableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    this.throwIfError(error);
    return data as TaskRow | null;
  }

  /**
   * Creates a task in the database.
   * @param task - Task data to persist.
   * @returns Created task row.
   * @throws The database error returned by Supabase.
   */
  async createTask(task: CreateTask): Promise<TaskRow> {
    const { data, error } = await this.supabase
      .from(this.taskTableName)
      .insert(createTaskInsertPayload(task))
      .select()
      .single();
    this.throwIfError(error);
    return data as TaskRow;
  }

  /**
   * Updates a task in the database.
   * @param id - Identifier of the task to update.
   * @param task - Task fields to persist.
   * @returns Updated task row.
   * @throws The database error returned by Supabase.
   */
  async updateTask(id: string, task: UpdateTask): Promise<TaskRow> {
    const { data, error } = await this.supabase
      .from(this.taskTableName)
      .update(createTaskUpdatePayload(task))
      .eq('id', id)
      .select()
      .single();
    this.throwIfError(error);
    return data as TaskRow;
  }

  /**
   * Persists multiple task status and position changes.
   * @param updates - Task position updates to persist.
   * @returns Updated task rows.
   */
  updateTaskPositions(updates: TaskPositionUpdate[]): Promise<TaskRow[]> {
    return Promise.all(updates.map((update) => this.updateTaskPosition(update)));
  }

  /**
   * Deletes a task from the database.
   * @param id - Identifier of the task to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase.from(this.taskTableName).delete().eq('id', id);
    this.throwIfError(error);
  }

  /**
   * Retrieves all subtasks belonging to a task.
   * @param taskId - Identifier of the parent task.
   * @returns Ordered subtask rows.
   */
  getSubtaskRows(taskId: string): Promise<SubtaskRow[]> {
    return this.subtasks.getSubtaskRows(taskId);
  }

  /**
   * Retrieves all subtask rows required by the board.
   * @returns Ordered subtask rows.
   */
  getAllSubtaskRows(): Promise<SubtaskRow[]> {
    return this.subtasks.getAllSubtaskRows();
  }

  /**
   * Creates a subtask in the database.
   * @param subtask - Subtask data to persist.
   * @returns Created subtask row.
   */
  createSubtask(subtask: CreateSubtask): Promise<SubtaskRow> {
    return this.subtasks.createSubtask(subtask);
  }

  /**
   * Updates a subtask in the database.
   * @param id - Identifier of the subtask to update.
   * @param subtask - Subtask fields to persist.
   * @returns Updated subtask row.
   */
  updateSubtask(id: string, subtask: UpdateSubtask): Promise<SubtaskRow> {
    return this.subtasks.updateSubtask(id, subtask);
  }

  /**
   * Updates a subtask while restricting the request to its parent task.
   * @param taskId - Identifier of the parent task.
   * @param id - Identifier of the subtask to update.
   * @param subtask - Subtask fields to persist.
   * @returns A promise that resolves after the update.
   */
  updateTaskSubtask(taskId: string, id: string, subtask: UpdateSubtask): Promise<void> {
    return this.subtasks.updateTaskSubtask(taskId, id, subtask);
  }

  /**
   * Deletes a subtask from the database.
   * @param id - Identifier of the subtask to delete.
   * @returns A promise that resolves after deletion.
   */
  deleteSubtask(id: string): Promise<void> {
    return this.subtasks.deleteSubtask(id);
  }

  /**
   * Deletes selected subtasks belonging to a task.
   * @param taskId - Identifier of the parent task.
   * @param subtaskIds - Identifiers of the subtasks to delete.
   * @returns A promise that resolves after deletion.
   */
  deleteTaskSubtasks(taskId: string, subtaskIds: string[]): Promise<void> {
    return this.subtasks.deleteTaskSubtasks(taskId, subtaskIds);
  }

  /**
   * Retrieves the contacts assigned to a task.
   * @param taskId - Identifier of the task.
   * @returns Mapped contacts assigned to the task.
   */
  getAssignedContacts(taskId: string): Promise<Contact[]> {
    return this.assignments.getAssignedContacts(taskId);
  }

  /**
   * Retrieves the identifiers of contacts assigned to a task.
   * @param taskId - Identifier of the task.
   * @returns Assigned contact identifiers.
   */
  getAssignedContactIds(taskId: string): Promise<string[]> {
    return this.assignments.getAssignedContactIds(taskId);
  }

  /**
   * Retrieves all task assignment rows required by the board.
   * @returns Ordered task assignment rows.
   */
  getAllAssignmentRows(): Promise<TaskAssignmentRow[]> {
    return this.assignments.getAllAssignmentRows();
  }

  /**
   * Assigns a contact to a task.
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to assign.
   * @returns A promise that resolves after assignment.
   */
  createTaskAssignment(taskId: string, contactId: string): Promise<void> {
    return this.assignments.createTaskAssignment(taskId, contactId);
  }

  /**
   * Assigns multiple contacts to a task.
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to assign.
   * @returns A promise that resolves after assignment.
   */
  createTaskAssignments(taskId: string, contactIds: string[]): Promise<void> {
    return this.assignments.createTaskAssignments(taskId, contactIds);
  }

  /**
   * Removes a contact assignment from a task.
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to unassign.
   * @returns A promise that resolves after deletion.
   */
  deleteTaskAssignment(taskId: string, contactId: string): Promise<void> {
    return this.assignments.deleteTaskAssignment(taskId, contactId);
  }

  /**
   * Removes multiple contact assignments from a task.
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to unassign.
   * @returns A promise that resolves after deletion.
   */
  deleteTaskAssignments(taskId: string, contactIds: string[]): Promise<void> {
    return this.assignments.deleteTaskAssignments(taskId, contactIds);
  }

  /**
   * Persists one task position update.
   * @param update - Position update to persist.
   * @returns Updated task row.
   */
  private updateTaskPosition(update: TaskPositionUpdate): Promise<TaskRow> {
    return this.updateTask(update.id, {
      status: update.status,
      sortOrder: update.sortOrder,
    });
  }

  /**
   * Throws a database error when one exists.
   * @param error - Error returned by Supabase.
   * @throws The provided database error.
   */
  private throwIfError(error: unknown): void {
    if (error) {
      throw error;
    }
  }
}