import { Injectable, inject } from '@angular/core';
import { mapContactRelations, TaskContactRelationRow } from '../mappers/task.mapper';
import { createTaskAssignmentRow, createTaskAssignmentRows } from '../mappers/task-payload.mapper';
import { Contact } from '../models/contact.model';
import { TaskAssignmentRow } from '../models/task-assignment.model';
import { SupabaseService } from '../supabase/supabase';

/**
 * Provides persistence operations for task-to-contact assignments.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskAssignmentRepository {
  /** Name of the task assignment database table. */
  private readonly tableName = 'task_assignments';

  /** Supabase client used for persistence requests. */
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Retrieves the contacts assigned to a task.
   * @param taskId - Identifier of the task.
   * @returns Mapped contacts assigned to the task.
   * @throws The database error returned by Supabase.
   */
  async getAssignedContacts(taskId: string): Promise<Contact[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('contacts(*)')
      .eq('task_id', taskId);
    this.throwIfError(error);
    return mapContactRelations((data ?? []) as unknown as TaskContactRelationRow[]);
  }

  /**
   * Retrieves the identifiers of contacts assigned to a task.
   * @param taskId - Identifier of the task.
   * @returns Assigned contact identifiers.
   * @throws The database error returned by Supabase.
   */
  async getAssignedContactIds(taskId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('contact_id')
      .eq('task_id', taskId);
    this.throwIfError(error);
    return this.mapContactIds(data);
  }

  /**
   * Retrieves all task assignment rows required by the board.
   * @returns Assignment rows ordered by task and creation time.
   * @throws The database error returned by Supabase.
   */
  async getAllAssignmentRows(): Promise<TaskAssignmentRow[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('task_id', { ascending: true })
      .order('created_at', { ascending: true });
    this.throwIfError(error);
    return (data ?? []) as TaskAssignmentRow[];
  }

  /**
   * Assigns a contact to a task.
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to assign.
   * @returns A promise that resolves after assignment.
   * @throws The database error returned by Supabase.
   */
  async createTaskAssignment(taskId: string, contactId: string): Promise<void> {
    const row = createTaskAssignmentRow(taskId, contactId);
    const { error } = await this.supabase.from(this.tableName).insert(row);
    this.throwIfError(error);
  }

  /**
   * Assigns multiple contacts to a task.
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to assign.
   * @returns A promise that resolves after assignment.
   * @throws The database error returned by Supabase.
   */
  async createTaskAssignments(taskId: string, contactIds: string[]): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }
    await this.insertAssignmentRows(taskId, contactIds);
  }

  /**
   * Removes a contact assignment from a task.
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to unassign.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  async deleteTaskAssignment(taskId: string, contactId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('task_id', taskId)
      .eq('contact_id', contactId);
    this.throwIfError(error);
  }

  /**
   * Removes multiple contact assignments from a task.
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to unassign.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  async deleteTaskAssignments(taskId: string, contactIds: string[]): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }
    await this.deleteAssignmentRows(taskId, contactIds);
  }

  /**
   * Inserts assignment rows for the selected contacts.
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to assign.
   * @returns A promise that resolves after insertion.
   * @throws The database error returned by Supabase.
   */
  private async insertAssignmentRows(taskId: string, contactIds: string[]): Promise<void> {
    const rows = createTaskAssignmentRows(taskId, contactIds);
    const { error } = await this.supabase.from(this.tableName).insert(rows);
    this.throwIfError(error);
  }

  /**
   * Deletes assignment rows for the selected contacts.
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to unassign.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  private async deleteAssignmentRows(taskId: string, contactIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('task_id', taskId)
      .in('contact_id', contactIds);
    this.throwIfError(error);
  }

  /**
   * Maps task assignment rows to their contact identifiers.
   * @param data - Assignment rows returned by Supabase.
   * @returns Contact identifiers from the rows.
   */
  private mapContactIds(data: unknown): string[] {
    const rows = (data ?? []) as Pick<TaskAssignmentRow, 'contact_id'>[];
    return rows.map((assignment) => assignment.contact_id);
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