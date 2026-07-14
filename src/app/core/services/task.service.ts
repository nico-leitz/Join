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