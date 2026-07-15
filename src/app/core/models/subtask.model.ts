export interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtask {
  taskId: string;
  title: string;
  sortOrder?: number;
}

export interface UpdateSubtask {
  title?: string;
  isCompleted?: boolean;
  sortOrder?: number;
}