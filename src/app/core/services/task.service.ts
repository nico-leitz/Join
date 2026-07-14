import { Injectable, inject, signal } from '@angular/core';
import { Task, TaskRow } from '../models/task.model';
import { SupabaseService } from '../supabase/supabase';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly tableName = 'tasks';
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

  private async fetchTaskRows(): Promise<TaskRow[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
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
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as TaskRow | null;
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
}