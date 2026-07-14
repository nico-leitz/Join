import { Injectable, inject, signal } from '@angular/core';
import { Subtask, SubtaskRow } from '../models/subtask.model';
import { Task, TaskRow } from '../models/task.model';
import { SupabaseService } from '../supabase/supabase';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly taskTableName = 'tasks';
  private readonly subtaskTableName = 'subtasks';
  private readonly supabase = inject(SupabaseService).client;

  allTasks = signal<Task[]>([]);
  selectedTask = signal<Task | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  async getTasks(): Promise<Task[]> {
    this.prepareLoadingState();

    try {
      const tasks = this.mapTaskRows(await this.fetchTaskRows());
      this.allTasks.set(tasks);
      return tasks;
    } catch (error) {
      this.handleLoadError('Tasks could not be loaded.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    this.prepareLoadingState();

    try {
      const taskRow = await this.fetchTaskRowById(id);
      const task = taskRow ? this.mapTaskRow(taskRow) : null;
      this.selectedTask.set(task);
      return task;
    } catch (error) {
      this.handleLoadError('Task could not be loaded.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
    this.prepareLoadingState();

    try {
      return this.mapSubtaskRows(await this.fetchSubtaskRows(taskId));
    } catch (error) {
      this.handleLoadError('Subtasks could not be loaded.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  private async fetchTaskRows(): Promise<TaskRow[]> {
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

  private async fetchTaskRowById(id: string): Promise<TaskRow | null> {
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

  private async fetchSubtaskRows(taskId: string): Promise<SubtaskRow[]> {
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

  private prepareLoadingState(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
  }

  private handleLoadError(message: string): void {
    this.errorMessage.set(message);
  }

  private mapTaskRows(taskRows: TaskRow[]): Task[] {
    return taskRows.map((taskRow) => this.mapTaskRow(taskRow));
  }

  private mapTaskRow(taskRow: TaskRow): Task {
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

  private mapSubtaskRows(subtaskRows: SubtaskRow[]): Subtask[] {
    return subtaskRows.map((subtaskRow) => this.mapSubtaskRow(subtaskRow));
  }

  private mapSubtaskRow(subtaskRow: SubtaskRow): Subtask {
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
}