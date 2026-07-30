import { Injectable, inject } from '@angular/core';
import {
  mapContactRelations,
  TaskContactRelationRow,
} from '../mappers/task.mapper';
import {
  createSubtaskInsertPayload,
  createSubtaskUpdatePayload,
  createTaskAssignmentRow,
  createTaskAssignmentRows,
  createTaskInsertPayload,
  createTaskUpdatePayload,
} from '../mappers/task-payload.mapper';
import { Contact } from '../models/contact.model';
import {
  CreateSubtask,
  SubtaskRow,
  UpdateSubtask,
} from '../models/subtask.model';
import { TaskAssignmentRow } from '../models/task-assignment.model';
import {
  CreateTask,
  TaskPositionUpdate,
  TaskRow,
  UpdateTask,
} from '../models/task.model';
import { SupabaseService } from '../supabase/supabase';

/**
 * Provides persistence operations for tasks, subtasks and assignments.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskRepository {
  /** Name of the task database table. */
  private readonly taskTableName = 'tasks';

  /** Name of the subtask database table. */
  private readonly subtaskTableName = 'subtasks';

  /** Name of the task assignment database table. */
  private readonly assignmentTableName = 'task_assignments';

  /** Supabase client used for persistence requests. */
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Retrieves all task rows in their board order.
   *
   * @returns Task rows ordered by position and creation time.
   * @throws The database error returned by Supabase.
   */
  async getTaskRows(): Promise<TaskRow[]> {
    const { data, error } = await this.supabase
      .from(this.taskTableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as TaskRow[];
  }

  /**
   * Retrieves a single task row by its identifier.
   *
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

    if (error) {
      throw error;
    }

    return data as TaskRow | null;
  }

  /**
   * Creates a task in the database.
   *
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

    if (error) {
      throw error;
    }

    return data as TaskRow;
  }

  /**
   * Updates a task in the database.
   *
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

    if (error) {
      throw error;
    }

    return data as TaskRow;
  }

  /**
   * Persists multiple task status and position changes.
   *
   * @param updates - Task position updates to persist.
   * @returns Updated task rows.
   * @throws The database error returned by Supabase.
   */
  async updateTaskPositions(
    updates: TaskPositionUpdate[]
  ): Promise<TaskRow[]> {
    return Promise.all(
      updates.map((update) => {
        return this.updateTask(update.id, {
          status: update.status,
          sortOrder: update.sortOrder,
        });
      }),
    );
  }

  /**
   * Deletes a task from the database.
   *
   * @param id - Identifier of the task to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.taskTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Retrieves all subtasks belonging to a task.
   *
   * @param taskId - Identifier of the parent task.
   * @returns Subtask rows ordered by position and creation time.
   * @throws The database error returned by Supabase.
   */
  async getSubtaskRows(taskId: string): Promise<SubtaskRow[]> {
    const { data, error } = await this.supabase
      .from(this.subtaskTableName)
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as SubtaskRow[];
  }

  /**
   * Retrieves all subtask rows required by the board.
   *
   * @returns Subtask rows ordered by task, position and creation time.
   * @throws The database error returned by Supabase.
   */
  async getAllSubtaskRows(): Promise<SubtaskRow[]> {
    const { data, error } = await this.supabase
      .from(this.subtaskTableName)
      .select('*')
      .order('task_id', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as SubtaskRow[];
  }

  /**
   * Creates a subtask in the database.
   *
   * @param subtask - Subtask data to persist.
   * @returns Created subtask row.
   * @throws The database error returned by Supabase.
   */
  async createSubtask(subtask: CreateSubtask): Promise<SubtaskRow> {
    const { data, error } = await this.supabase
      .from(this.subtaskTableName)
      .insert(createSubtaskInsertPayload(subtask))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as SubtaskRow;
  }

  /**
   * Updates a subtask in the database.
   *
   * @param id - Identifier of the subtask to update.
   * @param subtask - Subtask fields to persist.
   * @returns Updated subtask row.
   * @throws The database error returned by Supabase.
   */
  async updateSubtask(
    id: string,
    subtask: UpdateSubtask
  ): Promise<SubtaskRow> {
    const { data, error } = await this.supabase
      .from(this.subtaskTableName)
      .update(createSubtaskUpdatePayload(subtask))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as SubtaskRow;
  }

  /**
   * Updates a subtask while restricting the request to its parent task.
   *
   * @param taskId - Identifier of the parent task.
   * @param id - Identifier of the subtask to update.
   * @param subtask - Subtask fields to persist.
   * @returns A promise that resolves after the update.
   * @throws The database error returned by Supabase.
   */
  async updateTaskSubtask(
    taskId: string,
    id: string,
    subtask: UpdateSubtask,
  ): Promise<void> {
    const { error } = await this.supabase
      .from(this.subtaskTableName)
      .update(createSubtaskUpdatePayload(subtask))
      .eq('id', id)
      .eq('task_id', taskId);

    if (error) {
      throw error;
    }
  }

  /**
   * Deletes a subtask from the database.
   *
   * @param id - Identifier of the subtask to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  async deleteSubtask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.subtaskTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Deletes selected subtasks belonging to a task.
   *
   * @param taskId - Identifier of the parent task.
   * @param subtaskIds - Identifiers of the subtasks to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   */
  async deleteTaskSubtasks(
    taskId: string,
    subtaskIds: string[],
  ): Promise<void> {
    if (subtaskIds.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from(this.subtaskTableName)
      .delete()
      .eq('task_id', taskId)
      .in('id', subtaskIds);

    if (error) {
      throw error;
    }
  }

  /**
   * Retrieves the contacts assigned to a task.
   *
   * @param taskId - Identifier of the task.
   * @returns Mapped contacts assigned to the task.
   * @throws The database error returned by Supabase.
   */
  async getAssignedContacts(taskId: string): Promise<Contact[]> {
    const { data, error } = await this.supabase
      .from(this.assignmentTableName)
      .select('contacts(*)')
      .eq('task_id', taskId);

    if (error) {
      throw error;
    }

    return mapContactRelations(
      (data ?? []) as unknown as TaskContactRelationRow[],
    );
  }

  /**
   * Retrieves the identifiers of contacts assigned to a task.
   *
   * @param taskId - Identifier of the task.
   * @returns Assigned contact identifiers.
   * @throws The database error returned by Supabase.
   */
  async getAssignedContactIds(taskId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(this.assignmentTableName)
      .select('contact_id')
      .eq('task_id', taskId);

    if (error) {
      throw error;
    }

    const assignments = (data ?? []) as Pick<
      TaskAssignmentRow,
      'contact_id'
    >[];

    return assignments.map((assignment) => assignment.contact_id);
  }

  /**
   * Retrieves all task assignment rows required by the board.
   *
   * @returns Assignment rows ordered by task and creation time.
   * @throws The database error returned by Supabase.
   */
  async getAllAssignmentRows(): Promise<TaskAssignmentRow[]> {
    const { data, error } = await this.supabase
      .from(this.assignmentTableName)
      .select('*')
      .order('task_id', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as TaskAssignmentRow[];
  }

  /**
   * Assigns a contact to a task.
   *
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to assign.
   * @returns A promise that resolves after the assignment is created.
   * @throws The database error returned by Supabase.
   */
  async createTaskAssignment(
    taskId: string,
    contactId: string
  ): Promise<void> {
    const assignmentRow = createTaskAssignmentRow(taskId, contactId);
    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .insert(assignmentRow);

    if (error) {
      throw error;
    }
  }

  /**
   * Assigns multiple contacts to a task.
   *
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to assign.
   * @returns A promise that resolves after the assignments are created.
   * @throws The database error returned by Supabase.
   */
  async createTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }

    const assignmentRows = createTaskAssignmentRows(
      taskId,
      contactIds
    );
    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .insert(assignmentRows);

    if (error) {
      throw error;
    }
  }

  /**
   * Removes a contact assignment from a task.
   *
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to unassign.
   * @returns A promise that resolves after the assignment is deleted.
   * @throws The database error returned by Supabase.
   */
  async deleteTaskAssignment(
    taskId: string,
    contactId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .delete()
      .eq('task_id', taskId)
      .eq('contact_id', contactId);

    if (error) {
      throw error;
    }
  }

  /**
   * Removes multiple contact assignments from a task.
   *
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to unassign.
   * @returns A promise that resolves after the assignments are deleted.
   * @throws The database error returned by Supabase.
   */
  async deleteTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .delete()
      .eq('task_id', taskId)
      .in('contact_id', contactIds);

    if (error) {
      throw error;
    }
  }
}