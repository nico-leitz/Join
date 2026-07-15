import { Injectable, inject, signal } from '@angular/core';
import { Contact, ContactRow } from '../models/contact.model';
import {
  CreateSubtask,
  Subtask,
  SubtaskRow,
} from '../models/subtask.model';
import {
  CreateTask,
  Task,
  TaskRow,
  UpdateTask,
} from '../models/task.model';
import { SupabaseService } from '../supabase/supabase';

interface TaskContactRelationRow {
  contacts: ContactRow | null;
}

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
      const tasks = this.mapTaskRows(await this.fetchTaskRows());
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
      const task = taskRow ? this.mapTaskRow(taskRow) : null;
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
      const subtasks = this.mapSubtaskRows(
        await this.fetchSubtaskRows(taskId),
      );
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
      const contacts = await this.fetchAssignedContacts(taskId);
      this.assignedContacts.set(contacts);
      return contacts;
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
      const createdTask = this.mapTaskRow(await this.insertTask(task));
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
      const updatedTask = this.mapTaskRow(
        await this.updateTaskRow(id, task),
      );
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
      const subtaskRow = await this.insertSubtask(subtask);
      const createdSubtask = this.mapSubtaskRow(subtaskRow);
      this.addSubtaskToState(createdSubtask);
      return createdSubtask;
    } catch (error) {
      this.handleRequestError('Subtask could not be created.');
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

    return this.mapContactRelations(
      (data ?? []) as unknown as TaskContactRelationRow[],
    );
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

  private replaceTask(tasks: Task[], updatedTask: Task): Task[] {
    const updatedTasks = tasks.map((task) => {
      return task.id === updatedTask.id ? updatedTask : task;
    });

    return this.sortTasks(updatedTasks);
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
    return subtaskRows.map((subtaskRow) => {
      return this.mapSubtaskRow(subtaskRow);
    });
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

  private mapContactRelations(
    relations: TaskContactRelationRow[],
  ): Contact[] {
    return relations
      .map((relation) => relation.contacts)
      .filter((contact): contact is ContactRow => contact !== null)
      .map((contact) => this.mapContactRow(contact));
  }

  private mapContactRow(contactRow: ContactRow): Contact {
    return {
      id: contactRow.id,
      firstName: contactRow.first_name,
      lastName: contactRow.last_name,
      email: contactRow.email,
      phone: contactRow.phone,
      badgeColor: contactRow.badge_color,
      createdAt: contactRow.created_at,
      updatedAt: contactRow.updated_at,
    };
  }
}