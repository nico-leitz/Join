import { Injectable, inject } from '@angular/core';
import {
  createSubtaskInsertPayload,
  createSubtaskUpdatePayload,
} from '../mappers/task-payload.mapper';
import { CreateSubtask, SubtaskRow, UpdateSubtask } from '../models/subtask.model';
import { SupabaseService } from '../supabase/supabase';

/**
 * Provides persistence operations for task subtasks.
 */
@Injectable({
  providedIn: 'root',
})
export class SubtaskRepository {
  /** Name of the subtask database table. */
  private readonly tableName = 'subtasks';

  /** Supabase client used for persistence requests. */
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Retrieves all subtasks belonging to a task.
   * @param taskId - Identifier of the parent task.
   * @returns Subtask rows ordered by position and creation time.
   * @throws The database error returned by Supabase.
   */
  async getSubtaskRows(taskId: string): Promise<SubtaskRow[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    this.throwIfError(error);
    return (data ?? []) as SubtaskRow[];
  }

  /**
   * Retrieves all subtask rows required by the board.
   * @returns Subtask rows ordered by task, position and creation time.
   * @throws The database error returned by Supabase.
   */
  async getAllSubtaskRows(): Promise<SubtaskRow[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('task_id', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    this.throwIfError(error);
    return (data ?? []) as SubtaskRow[];
  }

  /**
   * Creates a subtask in the database.
   * @param subtask - Subtask data to persist.
   * @returns Created subtask row.
   * @throws The database error returned by Supabase.
   */
  async createSubtask(subtask: CreateSubtask): Promise<SubtaskRow> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(createSubtaskInsertPayload(subtask))
      .select()
      .single();
    this.throwIfError(error);
    return data as SubtaskRow;
  }

  /**
   * Updates a subtask in the database.
   * @param id - Identifier of the subtask to update.
   * @param subtask - Subtask fields to persist.
   * @returns Updated subtask row.
   * @throws The database error returned by Supabase.
   */
  async updateSubtask(id: string, subtask: UpdateSubtask): Promise<SubtaskRow> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(createSubtaskUpdatePayload(subtask))
      .eq('id', id)
      .select()
      .single();
    this.throwIfError(error);
    return data as SubtaskRow;
  }

  /**
   * Updates a subtask while restricting the request to its parent task.
   * @param taskId - Identifier of the parent task.
   * @param id - Identifier of the subtask to update.
   * @param subtask - Subtask fields to persist.
   * @returns A promise that resolves after the update.
   * @throws The database error returned by Supabase.
   */
  async updateTaskSubtask(taskId: string, id: string, subtask: UpdateSubtask): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update(createSubtaskUpdatePayload(subtask))
      .eq('id', id)
      .eq('task_id', taskId);
    this.throwIfError(error);
  }

  /**
   * Deletes a subtask from the database.
   * @param id - Identifier of the subtask to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  async deleteSubtask(id: string): Promise<void> {
    const { error } = await this.supabase.from(this.tableName).delete().eq('id', id);
    this.throwIfError(error);
  }

  /**
   * Deletes selected subtasks belonging to a task.
   * @param taskId - Identifier of the parent task.
   * @param subtaskIds - Identifiers of the subtasks to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  async deleteTaskSubtasks(taskId: string, subtaskIds: string[]): Promise<void> {
    if (subtaskIds.length === 0) {
      return;
    }
    await this.deleteSubtaskRows(taskId, subtaskIds);
  }

  /**
   * Deletes the selected subtask rows.
   * @param taskId - Identifier of the parent task.
   * @param subtaskIds - Identifiers of the subtasks to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  private async deleteSubtaskRows(taskId: string, subtaskIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('task_id', taskId)
      .in('id', subtaskIds);
    this.throwIfError(error);
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