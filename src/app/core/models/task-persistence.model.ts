import { CreateTask } from './task.model';

export interface CreateTaskSubtaskInput {
  title: string;
  sortOrder?: number;
}

export interface CreateTaskWithRelationsInput {
  task: CreateTask;
  subtasks?: CreateTaskSubtaskInput[];
  contactIds?: string[];
}