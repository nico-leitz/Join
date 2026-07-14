export type TaskPriority = 'urgent' | 'medium' | 'low';

export type TaskCategory = 'technical_task' | 'user_story';

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'awaiting_feedback'
  | 'done';

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTask {
  title: string;
  description?: string;
  dueDate: string;
  priority?: TaskPriority;
  category: TaskCategory;
  status?: TaskStatus;
  sortOrder?: number;
}

export interface UpdateTask {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  status?: TaskStatus;
  sortOrder?: number;
}