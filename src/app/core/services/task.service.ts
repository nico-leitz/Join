import { Injectable, inject, signal } from '@angular/core';
import { Task } from '../models/task.model';
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
}