import { Injectable, inject, signal } from '@angular/core';
import {
  mapContactRelations,
  mapSubtaskRow,
  mapSubtaskRows,
  mapTaskRow,
  mapTaskRows,
  TaskContactRelationRow,
} from '../mappers/task.mapper';
import {
  createSubtaskInsertPayload,
  createSubtaskUpdatePayload,
  createTaskAssignmentRow,
  createTaskAssignmentRows,
  createTaskInsertPayload,
  createTaskUpdatePayload,
} from '../mappers/task-payload.mapper';
import { Contact } from '../models/contact.model';
import {
  CreateSubtask,
  Subtask,
  SubtaskRow,
  UpdateSubtask,
} from '../models/subtask.model';
import { TaskAssignmentRow } from '../models/task-assignment.model';
import {
  CreateTaskSubtaskInput,
  CreateTaskWithRelationsInput,
  UpdateTaskSubtaskInput,
  UpdateTaskWithRelationsInput,
} from '../models/task-persistence.model';
import {
  CreateTask,
  Task,
  TaskRow,
  UpdateTask,
} from '../models/task.model';
import { SupabaseService } from '../supabase/supabase';
import {
  getMissingIds,
  getUniqueIds,
  replaceSubtask,
  replaceTask,
  sortSubtasks,
  sortTasks,
} from '../utils/task-state.utils';

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
      const taskRows = await this.fetchTaskRows();
      const tasks = mapTaskRows(taskRows);
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

  async getSubtasksByTaskId(
    taskId: string,
  ): Promise<Subtask[]> {
    this.prepareLoadingState();

    try {
      return await this.refreshTaskSubtasks(taskId);
    } catch (error) {
      this.handleRequestError('Subtasks could not be loaded.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getAssignedContacts(
    taskId: string,
  ): Promise<Contact[]> {
    this.prepareLoadingState();

    try {
      return await this.refreshAssignedContacts(taskId);
    } catch (error) {
      this.handleRequestError(
        'Assigned contacts could not be loaded.',
      );
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createTask(task: CreateTask): Promise<Task> {
    this.prepareLoadingState();

    try {
      const taskRow = await this.insertTask(task);
      const createdTask = mapTaskRow(taskRow);
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

  async createTaskWithRelations(
    input: CreateTaskWithRelationsInput,
  ): Promise<Task> {
    this.prepareLoadingState();
    let createdTaskId: string | null = null;

    try {
      const task = mapTaskRow(await this.insertTask(input.task));
      createdTaskId = task.id;

      const subtasks = await this.createSubtasksForTask(
        task.id,
        input.subtasks ?? [],
      );

      const contactIds = getUniqueIds(input.contactIds ?? []);
      await this.insertTaskAssignments(task.id, contactIds);

      const contacts = await this.fetchAssignedContacts(task.id);
      this.applyCreatedTaskState(task, subtasks, contacts);

      return task;
    } catch (error) {
      await this.rollbackCreatedTask(createdTaskId);
      this.handleRequestError(
        'Task and its relations could not be created.',
      );
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateTask(
    id: string,
    task: UpdateTask,
  ): Promise<Task> {
    this.prepareLoadingState();

    try {
      const taskRow = await this.updateTaskRow(id, task);
      const updatedTask = mapTaskRow(taskRow);
      this.updateTaskInState(updatedTask);
      return updatedTask;
    } catch (error) {
      this.handleRequestError('Task could not be updated.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateTaskWithRelations(
    id: string,
    input: UpdateTaskWithRelationsInput,
  ): Promise<Task> {
    this.prepareLoadingState();

    try {
      const taskRow = await this.updateTaskRow(id, input.task);
      const updatedTask = mapTaskRow(taskRow);

      const subtasks = await this.updateOptionalTaskSubtasks(
        id,
        input.subtasks,
      );

      const contacts = await this.updateOptionalAssignments(
        id,
        input.contactIds,
      );

      this.applyUpdatedTaskState(
        updatedTask,
        subtasks,
        contacts,
      );

      return updatedTask;
    } catch (error) {
      await this.refreshTaskStateAfterFailure(id);
      this.handleRequestError(
        'Task and its relations could not be updated.',
      );
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async replaceTaskSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<Subtask[]> {
    this.prepareLoadingState();

    try {
      await this.synchronizeTaskSubtasks(taskId, subtasks);
      return await this.refreshTaskSubtasks(taskId);
    } catch (error) {
      this.handleRequestError(
        'Task subtasks could not be updated.',
      );
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

  async createSubtask(
    subtask: CreateSubtask,
  ): Promise<Subtask> {
    this.prepareLoadingState();

    try {
      const subtaskRow = await this.insertSubtask(subtask);
      const createdSubtask = mapSubtaskRow(subtaskRow);
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
      const subtaskRow = await this.updateSubtaskRow(
        id,
        subtask,
      );

      const updatedSubtask = mapSubtaskRow(subtaskRow);
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
      await this.insertTaskAssignment(taskId, contactId);
      return await this.refreshAssignedContacts(taskId);
    } catch (error) {
      this.handleRequestError('Contact could not be assigned.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async removeContactAssignment(
    taskId: string,
    contactId: string,
  ): Promise<Contact[]> {
    this.prepareLoadingState();

    try {
      await this.deleteTaskAssignment(taskId, contactId);
      return await this.refreshAssignedContacts(taskId);
    } catch (error) {
      this.handleRequestError(
        'Contact assignment could not be removed.',
      );
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async replaceTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<Contact[]> {
    this.prepareLoadingState();

    try {
      await this.synchronizeTaskAssignments(
        taskId,
        contactIds,
      );

      return await this.refreshAssignedContacts(taskId);
    } catch (error) {
      this.handleRequestError(
        'Contact assignments could not be updated.',
      );
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

  private async fetchTaskRowById(
    id: string,
  ): Promise<TaskRow | null> {
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

  private async fetchSubtaskRows(
    taskId: string,
  ): Promise<SubtaskRow[]> {
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

  private async fetchAssignedContacts(
    taskId: string,
  ): Promise<Contact[]> {
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

  private async fetchAssignedContactIds(
    taskId: string,
  ): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(this.assignmentTableName)
      .select('contact_id')
      .eq('task_id', taskId);

    if (error) {
      throw error;
    }

    const assignmentRows = (data ?? []) as Pick<
      TaskAssignmentRow,
      'contact_id'
    >[];

    return assignmentRows.map((assignment) => {
      return assignment.contact_id;
    });
  }

  private async refreshTaskSubtasks(
    taskId: string,
  ): Promise<Subtask[]> {
    const subtaskRows = await this.fetchSubtaskRows(taskId);
    const subtasks = mapSubtaskRows(subtaskRows);

    if (this.selectedTask()?.id === taskId) {
      this.selectedSubtasks.set(subtasks);
    }

    return subtasks;
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

  private async insertTask(
    task: CreateTask,
  ): Promise<TaskRow> {
    const { data, error } = await this.supabase
      .from(this.taskTableName)
      .insert(createTaskInsertPayload(task))
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
      .update(createTaskUpdatePayload(task))
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
      .insert(createSubtaskInsertPayload(subtask))
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
      .update(createSubtaskUpdatePayload(subtask))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as SubtaskRow;
  }

  private async updateRelatedSubtaskRow(
    taskId: string,
    id: string,
    subtask: UpdateSubtask,
  ): Promise<void> {
    const { error } = await this.supabase
      .from(this.subtaskTableName)
      .update(createSubtaskUpdatePayload(subtask))
      .eq('id', id)
      .eq('task_id', taskId);

    if (error) {
      throw error;
    }
  }

  private async deleteSubtaskRow(
    id: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from(this.subtaskTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  private async deleteTaskSubtasks(
    taskId: string,
    subtaskIds: string[],
  ): Promise<void> {
    if (subtaskIds.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from(this.subtaskTableName)
      .delete()
      .eq('task_id', taskId)
      .in('id', subtaskIds);

    if (error) {
      throw error;
    }
  }

  private async createSubtasksForTask(
    taskId: string,
    subtasks: CreateTaskSubtaskInput[],
  ): Promise<Subtask[]> {
    const createdSubtasks: Subtask[] = [];

    for (const [index, subtask] of subtasks.entries()) {
      const createdSubtask = await this.createRelatedSubtask(
        taskId,
        subtask,
        index,
      );

      createdSubtasks.push(createdSubtask);
    }

    return sortSubtasks(createdSubtasks);
  }

  private async createRelatedSubtask(
    taskId: string,
    subtask: CreateTaskSubtaskInput,
    index: number,
  ): Promise<Subtask> {
    const subtaskRow = await this.insertSubtask({
      taskId,
      title: subtask.title,
      sortOrder: subtask.sortOrder ?? index,
    });

    return mapSubtaskRow(subtaskRow);
  }

  private async synchronizeTaskSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<void> {
    const currentRows = await this.fetchSubtaskRows(taskId);
    const currentIds = currentRows.map((subtask) => {
      return subtask.id;
    });

    const requestedIds = this.getRequestedSubtaskIds(subtasks);

    this.validateRequestedSubtaskIds(
      currentIds,
      requestedIds,
    );

    await this.persistTaskSubtasks(taskId, subtasks);

    const removedIds = getMissingIds(
      currentIds,
      requestedIds,
    );

    await this.deleteTaskSubtasks(taskId, removedIds);
  }

  private async persistTaskSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<void> {
    for (const [index, subtask] of subtasks.entries()) {
      await this.persistTaskSubtask(
        taskId,
        subtask,
        index,
      );
    }
  }

  private async persistTaskSubtask(
    taskId: string,
    subtask: UpdateTaskSubtaskInput,
    index: number,
  ): Promise<void> {
    if (subtask.id) {
      await this.updateRelatedSubtask(
        taskId,
        subtask,
        index,
      );

      return;
    }

    await this.insertSubtask({
      taskId,
      title: subtask.title,
      sortOrder: subtask.sortOrder ?? index,
    });
  }

  private async updateRelatedSubtask(
    taskId: string,
    subtask: UpdateTaskSubtaskInput,
    index: number,
  ): Promise<void> {
    if (!subtask.id) {
      return;
    }

    await this.updateRelatedSubtaskRow(
      taskId,
      subtask.id,
      this.createRelatedSubtaskUpdate(subtask, index),
    );
  }

  private createRelatedSubtaskUpdate(
    subtask: UpdateTaskSubtaskInput,
    index: number,
  ): UpdateSubtask {
    return {
      title: subtask.title,
      sortOrder: subtask.sortOrder ?? index,
      ...(subtask.isCompleted !== undefined && {
        isCompleted: subtask.isCompleted,
      }),
    };
  }

  private getRequestedSubtaskIds(
    subtasks: UpdateTaskSubtaskInput[],
  ): string[] {
    return subtasks.flatMap((subtask) => {
      return subtask.id ? [subtask.id] : [];
    });
  }

  private validateRequestedSubtaskIds(
    currentIds: string[],
    requestedIds: string[],
  ): void {
    const uniqueIds = getUniqueIds(requestedIds);

    if (uniqueIds.length !== requestedIds.length) {
      throw new Error(
        'Duplicate subtask IDs are not allowed.',
      );
    }

    const invalidIds = getMissingIds(
      uniqueIds,
      currentIds,
    );

    if (invalidIds.length > 0) {
      throw new Error(
        'Subtask does not belong to this task.',
      );
    }
  }

  private async insertTaskAssignment(
    taskId: string,
    contactId: string,
  ): Promise<void> {
    const assignmentRow = createTaskAssignmentRow(
      taskId,
      contactId,
    );

    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .insert(assignmentRow);

    if (error) {
      throw error;
    }
  }

  private async insertTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }

    const assignmentRows = createTaskAssignmentRows(
      taskId,
      contactIds,
    );

    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .insert(assignmentRows);

    if (error) {
      throw error;
    }
  }

  private async deleteTaskAssignment(
    taskId: string,
    contactId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .delete()
      .eq('task_id', taskId)
      .eq('contact_id', contactId);

    if (error) {
      throw error;
    }
  }

  private async deleteTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from(this.assignmentTableName)
      .delete()
      .eq('task_id', taskId)
      .in('contact_id', contactIds);

    if (error) {
      throw error;
    }
  }

  private async synchronizeTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<void> {
    const currentIds =
      await this.fetchAssignedContactIds(taskId);

    const requestedIds = getUniqueIds(contactIds);
    const removedIds = getMissingIds(
      currentIds,
      requestedIds,
    );

    const addedIds = getMissingIds(
      requestedIds,
      currentIds,
    );

    await this.deleteTaskAssignments(taskId, removedIds);
    await this.insertTaskAssignments(taskId, addedIds);
  }

  private async updateOptionalTaskSubtasks(
    taskId: string,
    subtasks?: UpdateTaskSubtaskInput[],
  ): Promise<Subtask[] | undefined> {
    if (subtasks === undefined) {
      return undefined;
    }

    await this.synchronizeTaskSubtasks(taskId, subtasks);
    const subtaskRows = await this.fetchSubtaskRows(taskId);
    return mapSubtaskRows(subtaskRows);
  }

  private async updateOptionalAssignments(
    taskId: string,
    contactIds?: string[],
  ): Promise<Contact[] | undefined> {
    if (contactIds === undefined) {
      return undefined;
    }

    await this.synchronizeTaskAssignments(
      taskId,
      contactIds,
    );

    return this.fetchAssignedContacts(taskId);
  }

  private async rollbackCreatedTask(
    taskId: string | null,
  ): Promise<void> {
    if (!taskId) {
      return;
    }

    try {
      await this.deleteTaskRow(taskId);
    } catch {
      return;
    }
  }

  private async refreshTaskStateAfterFailure(
    taskId: string,
  ): Promise<void> {
    try {
      const taskRow = await this.fetchTaskRowById(taskId);

      if (!taskRow) {
        return;
      }

      const task = mapTaskRow(taskRow);
      const isSelected =
        this.selectedTask()?.id === taskId;

      this.updateTaskInState(task);

      if (!isSelected) {
        return;
      }

      const [subtaskRows, contacts] = await Promise.all([
        this.fetchSubtaskRows(taskId),
        this.fetchAssignedContacts(taskId),
      ]);

      this.selectedSubtasks.set(
        mapSubtaskRows(subtaskRows),
      );

      this.assignedContacts.set(contacts);
    } catch {
      return;
    }
  }

  private applyCreatedTaskState(
    task: Task,
    subtasks: Subtask[],
    contacts: Contact[],
  ): void {
    this.addTaskToState(task);
    this.selectedTask.set(task);
    this.selectedSubtasks.set(subtasks);
    this.assignedContacts.set(contacts);
  }

  private applyUpdatedTaskState(
    task: Task,
    subtasks?: Subtask[],
    contacts?: Contact[],
  ): void {
    this.updateTaskInState(task);

    if (this.selectedTask()?.id !== task.id) {
      return;
    }

    if (subtasks !== undefined) {
      this.selectedSubtasks.set(subtasks);
    }

    if (contacts !== undefined) {
      this.assignedContacts.set(contacts);
    }
  }

  private addTaskToState(task: Task): void {
    this.allTasks.update((tasks) => {
      return sortTasks([...tasks, task]);
    });
  }

  private updateTaskInState(updatedTask: Task): void {
    this.allTasks.update((tasks) => {
      return replaceTask(tasks, updatedTask);
    });

    if (this.selectedTask()?.id === updatedTask.id) {
      this.selectedTask.set(updatedTask);
    }
  }

  private removeTaskFromState(taskId: string): void {
    this.allTasks.update((tasks) => {
      return tasks.filter((task) => {
        return task.id !== taskId;
      });
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
      return sortSubtasks([...subtasks, subtask]);
    });
  }

  private updateSubtaskInState(
    updatedSubtask: Subtask,
  ): void {
    this.selectedSubtasks.update((subtasks) => {
      return replaceSubtask(subtasks, updatedSubtask);
    });
  }

  private removeSubtaskFromState(
    subtaskId: string,
  ): void {
    this.selectedSubtasks.update((subtasks) => {
      return subtasks.filter((subtask) => {
        return subtask.id !== subtaskId;
      });
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