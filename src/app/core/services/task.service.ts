import {
  Injectable,
  inject,
  signal,
} from '@angular/core';
import {
  mapSubtaskRow,
  mapSubtaskRows,
  mapTaskRow,
  mapTaskRows,
} from '../mappers/task.mapper';
import { Contact } from '../models/contact.model';
import {
  CreateSubtask,
  Subtask,
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
  UpdateTask,
} from '../models/task.model';
import { TaskRepository } from '../repositories/task.repository';
import {
  getMissingIds,
  getUniqueIds,
  replaceSubtask,
  replaceTask,
  sortSubtasks,
  sortTasks,
} from '../utils/task-state.utils';

export interface BoardRelationsData {
  subtasks: Subtask[];
  assignments: TaskAssignmentRow[];
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly repository = inject(TaskRepository);

  readonly allTasks = signal<Task[]>([]);
  readonly selectedTask = signal<Task | null>(null);
  readonly selectedSubtasks = signal<Subtask[]>([]);
  readonly assignedContacts = signal<Contact[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  async getTasks(): Promise<Task[]> {
    this.prepareLoadingState();

    try {
      const taskRows =
        await this.repository.getTaskRows();

      const tasks = mapTaskRows(taskRows);

      this.allTasks.set(tasks);

      return tasks;
    } catch (error) {
      this.handleRequestError(
        'Tasks could not be loaded.',
      );

      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getTaskById(
    id: string,
  ): Promise<Task | null> {
    this.prepareLoadingState();

    try {
      const taskRow =
        await this.repository.getTaskRowById(id);

      const task = taskRow
        ? mapTaskRow(taskRow)
        : null;

      this.selectedTask.set(task);

      return task;
    } catch (error) {
      this.handleRequestError(
        'Task could not be loaded.',
      );

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
      this.handleRequestError(
        'Subtasks could not be loaded.',
      );

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
      return await this.refreshAssignedContacts(
        taskId,
      );
    } catch (error) {
      this.handleRequestError(
        'Assigned contacts could not be loaded.',
      );

      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadAllBoardData(): Promise<
    BoardRelationsData
  > {
    const [subtaskRows, assignmentRows] =
      await Promise.all([
        this.repository.getAllSubtaskRows(),
        this.repository.getAllAssignmentRows(),
      ]);

    return {
      subtasks: mapSubtaskRows(subtaskRows),
      assignments: assignmentRows,
    };
  }

  async createTask(
    task: CreateTask,
  ): Promise<Task> {
    this.prepareLoadingState();

    try {
      const taskRow =
        await this.repository.createTask(task);

      const createdTask = mapTaskRow(taskRow);

      this.addTaskToState(createdTask);
      this.selectedTask.set(createdTask);

      return createdTask;
    } catch (error) {
      this.handleRequestError(
        'Task could not be created.',
      );

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
      const taskRow =
        await this.repository.createTask(
          input.task,
        );

      const task = mapTaskRow(taskRow);

      createdTaskId = task.id;

      const subtasks =
        await this.createSubtasksForTask(
          task.id,
          input.subtasks ?? [],
        );

      const contactIds = getUniqueIds(
        input.contactIds ?? [],
      );

      await this.repository.createTaskAssignments(
        task.id,
        contactIds,
      );

      const contacts =
        await this.repository.getAssignedContacts(
          task.id,
        );

      this.applyCreatedTaskState(
        task,
        subtasks,
        contacts,
      );

      return task;
    } catch (error) {
      await this.rollbackCreatedTask(
        createdTaskId,
      );

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
      const taskRow =
        await this.repository.updateTask(
          id,
          task,
        );

      const updatedTask = mapTaskRow(taskRow);

      this.updateTaskInState(updatedTask);

      return updatedTask;
    } catch (error) {
      this.handleRequestError(
        'Task could not be updated.',
      );

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
      const taskRow =
        await this.repository.updateTask(
          id,
          input.task,
        );

      const updatedTask = mapTaskRow(taskRow);

      const subtasks =
        await this.updateOptionalTaskSubtasks(
          id,
          input.subtasks,
        );

      const contacts =
        await this.updateOptionalAssignments(
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
      await this.synchronizeTaskSubtasks(
        taskId,
        subtasks,
      );

      return await this.refreshTaskSubtasks(
        taskId,
      );
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
      await this.repository.deleteTask(id);
      this.removeTaskFromState(id);
    } catch (error) {
      this.handleRequestError(
        'Task could not be deleted.',
      );

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
      const subtaskRow =
        await this.repository.createSubtask(
          subtask,
        );

      const createdSubtask =
        mapSubtaskRow(subtaskRow);

      this.addSubtaskToState(createdSubtask);

      return createdSubtask;
    } catch (error) {
      this.handleRequestError(
        'Subtask could not be created.',
      );

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
      const subtaskRow =
        await this.repository.updateSubtask(
          id,
          subtask,
        );

      const updatedSubtask =
        mapSubtaskRow(subtaskRow);

      this.updateSubtaskInState(
        updatedSubtask,
      );

      return updatedSubtask;
    } catch (error) {
      this.handleRequestError(
        'Subtask could not be updated.',
      );

      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleSubtaskCompletion(
    id: string,
    isCompleted: boolean,
  ): Promise<Subtask> {
    return this.updateSubtask(id, {
      isCompleted,
    });
  }

  async deleteSubtask(
    id: string,
  ): Promise<void> {
    this.prepareLoadingState();

    try {
      await this.repository.deleteSubtask(id);
      this.removeSubtaskFromState(id);
    } catch (error) {
      this.handleRequestError(
        'Subtask could not be deleted.',
      );

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
      await this.repository.createTaskAssignment(
        taskId,
        contactId,
      );

      return await this.refreshAssignedContacts(
        taskId,
      );
    } catch (error) {
      this.handleRequestError(
        'Contact could not be assigned.',
      );

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
      await this.repository.deleteTaskAssignment(
        taskId,
        contactId,
      );

      return await this.refreshAssignedContacts(
        taskId,
      );
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

      return await this.refreshAssignedContacts(
        taskId,
      );
    } catch (error) {
      this.handleRequestError(
        'Contact assignments could not be updated.',
      );

      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  private async refreshTaskSubtasks(
    taskId: string,
  ): Promise<Subtask[]> {
    const subtaskRows =
      await this.repository.getSubtaskRows(taskId);

    const subtasks =
      mapSubtaskRows(subtaskRows);

    if (this.selectedTask()?.id === taskId) {
      this.selectedSubtasks.set(subtasks);
    }

    return subtasks;
  }

  private async refreshAssignedContacts(
    taskId: string,
  ): Promise<Contact[]> {
    const contacts =
      await this.repository.getAssignedContacts(
        taskId,
      );

    if (this.selectedTask()?.id === taskId) {
      this.assignedContacts.set(contacts);
    }

    return contacts;
  }

  private async createSubtasksForTask(
    taskId: string,
    subtasks: CreateTaskSubtaskInput[],
  ): Promise<Subtask[]> {
    const createdSubtasks: Subtask[] = [];

    for (
      const [index, subtask]
      of subtasks.entries()
    ) {
      const createdSubtask =
        await this.createRelatedSubtask(
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
    const subtaskRow =
      await this.repository.createSubtask({
        taskId,
        title: subtask.title,
        sortOrder:
          subtask.sortOrder ?? index,
      });

    return mapSubtaskRow(subtaskRow);
  }

  private async synchronizeTaskSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<void> {
    const currentRows =
      await this.repository.getSubtaskRows(
        taskId,
      );

    const currentIds = currentRows.map(
      (subtask) => {
        return subtask.id;
      },
    );

    const requestedIds =
      this.getRequestedSubtaskIds(subtasks);

    this.validateRequestedSubtaskIds(
      currentIds,
      requestedIds,
    );

    await this.persistTaskSubtasks(
      taskId,
      subtasks,
    );

    const removedIds = getMissingIds(
      currentIds,
      requestedIds,
    );

    await this.repository.deleteTaskSubtasks(
      taskId,
      removedIds,
    );
  }

  private async persistTaskSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<void> {
    for (
      const [index, subtask]
      of subtasks.entries()
    ) {
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

    await this.repository.createSubtask({
      taskId,
      title: subtask.title,
      sortOrder:
        subtask.sortOrder ?? index,
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

    await this.repository.updateTaskSubtask(
      taskId,
      subtask.id,
      this.createRelatedSubtaskUpdate(
        subtask,
        index,
      ),
    );
  }

  private createRelatedSubtaskUpdate(
    subtask: UpdateTaskSubtaskInput,
    index: number,
  ): UpdateSubtask {
    return {
      title: subtask.title,
      sortOrder:
        subtask.sortOrder ?? index,
      ...(subtask.isCompleted !== undefined && {
        isCompleted:
          subtask.isCompleted,
      }),
    };
  }

  private getRequestedSubtaskIds(
    subtasks: UpdateTaskSubtaskInput[],
  ): string[] {
    return subtasks.flatMap((subtask) => {
      return subtask.id
        ? [subtask.id]
        : [];
    });
  }

  private validateRequestedSubtaskIds(
    currentIds: string[],
    requestedIds: string[],
  ): void {
    const uniqueIds =
      getUniqueIds(requestedIds);

    if (
      uniqueIds.length
      !== requestedIds.length
    ) {
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

  private async synchronizeTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<void> {
    const currentIds =
      await this.repository
        .getAssignedContactIds(taskId);

    const requestedIds =
      getUniqueIds(contactIds);

    const removedIds = getMissingIds(
      currentIds,
      requestedIds,
    );

    const addedIds = getMissingIds(
      requestedIds,
      currentIds,
    );

    await this.repository.deleteTaskAssignments(
      taskId,
      removedIds,
    );

    await this.repository.createTaskAssignments(
      taskId,
      addedIds,
    );
  }

  private async updateOptionalTaskSubtasks(
    taskId: string,
    subtasks?: UpdateTaskSubtaskInput[],
  ): Promise<Subtask[] | undefined> {
    if (subtasks === undefined) {
      return undefined;
    }

    await this.synchronizeTaskSubtasks(
      taskId,
      subtasks,
    );

    const subtaskRows =
      await this.repository.getSubtaskRows(
        taskId,
      );

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

    return this.repository.getAssignedContacts(
      taskId,
    );
  }

  private async rollbackCreatedTask(
    taskId: string | null,
  ): Promise<void> {
    if (!taskId) {
      return;
    }

    try {
      await this.repository.deleteTask(taskId);
    } catch {
      return;
    }
  }

  private async refreshTaskStateAfterFailure(
    taskId: string,
  ): Promise<void> {
    try {
      const taskRow =
        await this.repository.getTaskRowById(
          taskId,
        );

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

      const [subtaskRows, contacts] =
        await Promise.all([
          this.repository.getSubtaskRows(
            taskId,
          ),
          this.repository.getAssignedContacts(
            taskId,
          ),
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

    if (
      this.selectedTask()?.id
      !== task.id
    ) {
      return;
    }

    if (subtasks !== undefined) {
      this.selectedSubtasks.set(subtasks);
    }

    if (contacts !== undefined) {
      this.assignedContacts.set(contacts);
    }
  }

  private addTaskToState(
    task: Task,
  ): void {
    this.allTasks.update((tasks) => {
      return sortTasks([
        ...tasks,
        task,
      ]);
    });
  }

  private updateTaskInState(
    updatedTask: Task,
  ): void {
    this.allTasks.update((tasks) => {
      return replaceTask(
        tasks,
        updatedTask,
      );
    });

    if (
      this.selectedTask()?.id
      === updatedTask.id
    ) {
      this.selectedTask.set(updatedTask);
    }
  }

  private removeTaskFromState(
    taskId: string,
  ): void {
    this.allTasks.update((tasks) => {
      return tasks.filter((task) => {
        return task.id !== taskId;
      });
    });

    if (
      this.selectedTask()?.id
      === taskId
    ) {
      this.clearSelectedTaskState();
    }
  }

  private clearSelectedTaskState(): void {
    this.selectedTask.set(null);
    this.selectedSubtasks.set([]);
    this.assignedContacts.set([]);
  }

  private addSubtaskToState(
    subtask: Subtask,
  ): void {
    if (
      this.selectedTask()?.id
      !== subtask.taskId
    ) {
      return;
    }

    this.selectedSubtasks.update(
      (subtasks) => {
        return sortSubtasks([
          ...subtasks,
          subtask,
        ]);
      },
    );
  }

  private updateSubtaskInState(
    updatedSubtask: Subtask,
  ): void {
    this.selectedSubtasks.update(
      (subtasks) => {
        return replaceSubtask(
          subtasks,
          updatedSubtask,
        );
      },
    );
  }

  private removeSubtaskFromState(
    subtaskId: string,
  ): void {
    this.selectedSubtasks.update(
      (subtasks) => {
        return subtasks.filter(
          (subtask) => {
            return subtask.id
              !== subtaskId;
          },
        );
      },
    );
  }

  private prepareLoadingState(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
  }

  private handleRequestError(
    message: string,
  ): void {
    this.errorMessage.set(message);
  }
}