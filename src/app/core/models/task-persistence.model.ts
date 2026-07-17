import { CreateTask, UpdateTask } from './task.model';

export interface CreateTaskSubtaskInput {
  title: string;
  sortOrder?: number;
}

export interface UpdateTaskSubtaskInput {
  id?: string;
  title: string;
  isCompleted?: boolean;
  sortOrder?: number;
}

export interface CreateTaskWithRelationsInput {
  task: CreateTask;
  subtasks?: CreateTaskSubtaskInput[];
  contactIds?: string[];
}

export interface UpdateTaskWithRelationsInput {
  task: UpdateTask;
  subtasks?: UpdateTaskSubtaskInput[];
  contactIds?: string[];
}