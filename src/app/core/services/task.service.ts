import { Injectable, inject, signal } from '@angular/core';
import {
  mapContactRelations,
  mapSubtaskRow,
  mapSubtaskRows,
  mapTaskRow,
  mapTaskRows,
  TaskContactRelationRow,
} from '../mappers/task.mapper';
import { Contact } from '../models/contact.model';
import {
  CreateSubtask,
  Subtask,
  SubtaskRow,
  UpdateSubtask,
} from '../models/subtask.model';
import {
  CreateTaskAssignment,
  TaskAssignmentRow,
} from '../models/task-assignment.model';
import {
  CreateTask,
  Task,
  TaskRow,
  UpdateTask,
} from '../models/task.model';
import { SupabaseService } from '../supabase/supabase';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly taskTableName = 'tasks';
  private readonly subtaskTableName = 'subtasks';
  private readonly assignmentTableName = 'task_assignments';
  private readonly supabase = inject(SupabaseService).client;

  allTasks = signal<Task[]>([]);
  selectedTask = signal<Task | null>(null);
  selectedSubtasks = signal<Subtask[]>([]);
  assignedContacts = signal<Contact[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  async getTasks(): Promise<Task[]> {
    this.prepareLoadingState();

    try {
      const tasks = mapTaskRows(await this.fetchTaskRows());
      this.allTasks.set(tasks);
      return tasks;
    } catch (error) {
      this.handleRequestError('Tasks could not be loaded.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    this.prepareLoadingState();

    try {
      const taskRow = await this.fetchTaskRowById(id);
      const task = taskRow ? mapTaskRow(taskRow) : null;
      this.selectedTask.set(task);
      return task;
    } catch (error) {
      this.handleRequestError('Task could not be loaded.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
    this.prepareLoadingState();

    try {
      const subtasks = mapSubtaskRows(await this.fetchSubtaskRows(taskId));
      this.selectedSubtasks.set(subtasks);
      return subtasks;
    } catch (error) {
      this.handleRequestError('Subtasks could not be loaded.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getAssignedContacts(taskId: string): Promise<Contact[]> {
    this.prepareLoadingState();

    try {
      return await this.refreshAssignedContacts(taskId);
    } catch (error) {
      this.handleRequestError('Assigned contacts could not be loaded.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createTask(task: CreateTask): Promise<Task> {
    this.prepareLoadingState();

    try {
      const createdTask = mapTaskRow(await this.insertTask(task));
      this.addTaskToState(createdTask);
      this.selectedTask.set(createdTask);
      return createdTask;
    } catch (error) {
      this.handleRequestError('Task could not be created.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateTask(id: string, task: UpdateTask): Promise<Task> {
    this.prepareLoadingState();

    try {
      const updatedTask = mapTaskRow(await this.updateTaskRow(id, task));
      this.updateTaskInState(updatedTask);
      return updatedTask;
    } catch (error) {
      this.handleRequestError('Task could not be updated.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteTask(id: string): Promise<void> {
    this.prepareLoadingState();

    try {
      await this.deleteTaskRow(id);
      this.removeTaskFromState(id);
    } catch (error) {
      this.handleRequestError('Task could not be deleted.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createSubtask(subtask: CreateSubtask): Promise<Subtask> {
    this.prepareLoadingState();

    try {
      const createdSubtask = mapSubtaskRow(
        await this.insertSubtask(subtask),
      );
      this.addSubtaskToState(createdSubtask);
      return createdSubtask;
    } catch (error) {
      this.handleRequestError('Subtask could not be created.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateSubtask(
    id: string,
    subtask: UpdateSubtask,
  ): Promise<Subtask> {
    this.prepareLoadingState();

    try {
      const updatedSubtask = mapSubtaskRow(
        await this.updateSubtaskRow(id, subtask),
      );
      this.updateSubtaskInState(updatedSubtask);
      return updatedSubtask;
    } catch (error) {
      this.handleRequestError('Subtask could not be updated.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleSubtaskCompletion(
    id: string,
    isCompleted: boolean,
  ): Promise<Subtask> {
    return this.updateSubtask(id, { isCompleted });
  }

  async deleteSubtask(id: string): Promise<void> {
    this.prepareLoadingState();

    try {
      await this.deleteSubtaskRow(id);
      this.removeSubtaskFromState(id);
    } catch (error) {
      this.handleRequestError('Subtask could not be deleted.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async assignContact(
    taskId: string,
    contactId: string,
  ): Promise<Contact[]> {
    this.prepareLoadingState();

    try {
      await this.insertTaskAssignment({ taskId, contactId });
      return await this.refreshAssignedContacts(taskId);
    } catch (error) {
      this.handleRequestError('Contact could not be assigned.');
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

  private async fetchAssignedContacts(taskId: string): Promise<Contact[]> {
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

  private async refreshAssignedContacts(
    taskId: string,
  ): Promise<Contact[]> {
    const contacts = await this.fetchAssignedContacts(taskId);

    if (this.selectedTask()?.id === taskId) {
      this.assignedContacts.set(contacts);
    }

    return contacts;
  }

  private async insertTask(task: CreateTask): Promise<TaskRow> {
    const { data, error } = await this.supabase
      .from(this.taskTableName)
      .insert(this.createTaskInsertPayload(task))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as TaskRow;
  }

  private async updateTaskRow(
    id: string,
    task: UpdateTask,
  ): Promise<TaskRow> {
    const { data, error } = await this.supabase
      .from(this.taskTableName)
      .update(this.createTaskUpdatePayload(task))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as TaskRow;
  }

  private async deleteTaskRow(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.taskTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  private async insertSubtask(
    subtask: CreateSubtask,
  ): Promise<SubtaskRow> {
    const { data, error } = await this.supabase
      .from(this.subtaskTableName)
      .insert(this.createSubtaskInsertPayload(subtask))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as SubtaskRow;
  }

  private async updateSubtaskRow(
    id: string,
    subtask: UpdateSubtask,
  ): Promise<SubtaskRow> {
    const { data, error } = await this.supabase
      .from(this.subtaskTableName)
      .update(this.createSubtaskUpdatePayload(subtask))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as SubtaskRow;
  }

  private async deleteSubtaskRow(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.subtaskTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  private async insertTaskAssignment(
    assignment: CreateTaskAssignment,
  ): Promise<void> {
    const assignmentRow: Partial<TaskAssignmentRow> = {
      task_id: assignment.taskId,
      contact_id: assignment.contactId,
    };

    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .insert(assignmentRow);

    if (error) {
      throw error;
    }
  }

  private createTaskInsertPayload(task: CreateTask): Partial<TaskRow> {
    return {
      title: task.title.trim(),
      description: task.description?.trim() ?? '',
      due_date: task.dueDate,
      category: task.category,
      ...(task.priority !== undefined && { priority: task.priority }),
      ...(task.status !== undefined && { status: task.status }),
      ...(task.sortOrder !== undefined && { sort_order: task.sortOrder }),
    };
  }

  private createTaskUpdatePayload(task: UpdateTask): Partial<TaskRow> {
    return {
      ...(task.title !== undefined && { title: task.title.trim() }),
      ...(task.description !== undefined && {
        description: task.description.trim(),
      }),
      ...(task.dueDate !== undefined && { due_date: task.dueDate }),
      ...(task.priority !== undefined && { priority: task.priority }),
      ...(task.category !== undefined && { category: task.category }),
      ...(task.status !== undefined && { status: task.status }),
      ...(task.sortOrder !== undefined && { sort_order: task.sortOrder }),
      updated_at: new Date().toISOString(),
    };
  }

  private createSubtaskInsertPayload(
    subtask: CreateSubtask,
  ): Partial<SubtaskRow> {
    return {
      task_id: subtask.taskId,
      title: subtask.title.trim(),
      ...(subtask.sortOrder !== undefined && {
        sort_order: subtask.sortOrder,
      }),
    };
  }

  private createSubtaskUpdatePayload(
    subtask: UpdateSubtask,
  ): Partial<SubtaskRow> {
    return {
      ...(subtask.title !== undefined && {
        title: subtask.title.trim(),
      }),
      ...(subtask.isCompleted !== undefined && {
        is_completed: subtask.isCompleted,
      }),
      ...(subtask.sortOrder !== undefined && {
        sort_order: subtask.sortOrder,
      }),
      updated_at: new Date().toISOString(),
    };
  }

  private addTaskToState(task: Task): void {
    this.allTasks.update((tasks) => {
      return this.sortTasks([...tasks, task]);
    });
  }

  private updateTaskInState(updatedTask: Task): void {
    this.allTasks.update((tasks) => {
      return this.replaceTask(tasks, updatedTask);
    });

    if (this.selectedTask()?.id === updatedTask.id) {
      this.selectedTask.set(updatedTask);
    }
  }

  private removeTaskFromState(taskId: string): void {
    this.allTasks.update((tasks) => {
      return tasks.filter((task) => task.id !== taskId);
    });

    if (this.selectedTask()?.id === taskId) {
      this.clearSelectedTaskState();
    }
  }

  private clearSelectedTaskState(): void {
    this.selectedTask.set(null);
    this.selectedSubtasks.set([]);
    this.assignedContacts.set([]);
  }

  private addSubtaskToState(subtask: Subtask): void {
    if (this.selectedTask()?.id !== subtask.taskId) {
      return;
    }

    this.selectedSubtasks.update((subtasks) => {
      return this.sortSubtasks([...subtasks, subtask]);
    });
  }

  private updateSubtaskInState(updatedSubtask: Subtask): void {
    this.selectedSubtasks.update((subtasks) => {
      return this.replaceSubtask(subtasks, updatedSubtask);
    });
  }

  private removeSubtaskFromState(subtaskId: string): void {
    this.selectedSubtasks.update((subtasks) => {
      return subtasks.filter((subtask) => subtask.id !== subtaskId);
    });
  }

  private replaceTask(tasks: Task[], updatedTask: Task): Task[] {
    const updatedTasks = tasks.map((task) => {
      return task.id === updatedTask.id ? updatedTask : task;
    });

    return this.sortTasks(updatedTasks);
  }

  private replaceSubtask(
    subtasks: Subtask[],
    updatedSubtask: Subtask,
  ): Subtask[] {
    const updatedSubtasks = subtasks.map((subtask) => {
      return subtask.id === updatedSubtask.id
        ? updatedSubtask
        : subtask;
    });

    return this.sortSubtasks(updatedSubtasks);
  }

  private sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((firstTask, secondTask) => {
      return (
        firstTask.sortOrder - secondTask.sortOrder ||
        firstTask.createdAt.localeCompare(secondTask.createdAt)
      );
    });
  }

  private sortSubtasks(subtasks: Subtask[]): Subtask[] {
    return [...subtasks].sort((firstSubtask, secondSubtask) => {
      return (
        firstSubtask.sortOrder - secondSubtask.sortOrder ||
        firstSubtask.createdAt.localeCompare(secondSubtask.createdAt)
      );
    });
  }

  private prepareLoadingState(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
  }

  private handleRequestError(message: string): void {
    this.errorMessage.set(message);
  }
}