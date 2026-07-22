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
  TaskRow,
  UpdateTask,
} from '../models/task.model';
import { SupabaseService } from '../supabase/supabase';

@Injectable({
  providedIn: 'root',
})
export class TaskRepository {
  private readonly taskTableName = 'tasks';
  private readonly subtaskTableName = 'subtasks';
  private readonly assignmentTableName = 'task_assignments';

  private readonly supabase =
    inject(SupabaseService).client;

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

  async getTaskRowById(
    id: string,
  ): Promise<TaskRow | null> {
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

  async createTask(
    task: CreateTask,
  ): Promise<TaskRow> {
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

  async updateTask(
    id: string,
    task: UpdateTask,
  ): Promise<TaskRow> {
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

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.taskTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async getSubtaskRows(
    taskId: string,
  ): Promise<SubtaskRow[]> {
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

  async createSubtask(
    subtask: CreateSubtask,
  ): Promise<SubtaskRow> {
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

  async updateSubtask(
    id: string,
    subtask: UpdateSubtask,
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

  async deleteSubtask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.subtaskTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

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

  async getAssignedContacts(
    taskId: string,
  ): Promise<Contact[]> {
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

  async getAssignedContactIds(
    taskId: string,
  ): Promise<string[]> {
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

    return assignments.map((assignment) => {
      return assignment.contact_id;
    });
  }

  async getAllAssignmentRows(): Promise<
    TaskAssignmentRow[]
  > {
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

  async createTaskAssignment(
    taskId: string,
    contactId: string,
  ): Promise<void> {
    const assignmentRow = createTaskAssignmentRow(
      taskId,
      contactId,
    );

    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .insert(assignmentRow);

    if (error) {
      throw error;
    }
  }

  async createTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }

    const assignmentRows = createTaskAssignmentRows(
      taskId,
      contactIds,
    );

    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .insert(assignmentRows);

    if (error) {
      throw error;
    }
  }

  async deleteTaskAssignment(
    taskId: string,
    contactId: string,
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