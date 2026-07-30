import { Injectable, inject, signal } from '@angular/core';
import {
  mapSubtaskRows,
  mapTaskRow,
  mapTaskRows,
} from '../mappers/task.mapper';
import { Contact } from '../models/contact.model';
import { CreateSubtask, Subtask, UpdateSubtask } from '../models/subtask.model';
import {
  CreateTaskWithRelationsInput,
  UpdateTaskSubtaskInput,
  UpdateTaskWithRelationsInput,
} from '../models/task-persistence.model';
import type { BoardRelationsData } from '../models/task-relations.model';
import {
  CreateTask,
  Task,
  TaskPositionUpdate,
  UpdateTask,
} from '../models/task.model';
import { TaskRepository } from '../repositories/task.repository';
import { TaskRelationsService } from './task-relations.service';
import { TaskStateService } from './task-state.service';

export type { BoardRelationsData } from '../models/task-relations.model';

/**
 * Coordinates task persistence, relation operations and application state.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskService {
  /** Repository used for task persistence requests. */
  private readonly repository = inject(TaskRepository);

  /** Service used for subtask and assignment operations. */
  private readonly relations = inject(TaskRelationsService);

  /** Service owning the in-memory task state. */
  private readonly state = inject(TaskStateService);

  /** Complete task collection exposed from the task state service. */
  readonly allTasks = this.state.allTasks;

  /** Currently selected task exposed from the task state service. */
  readonly selectedTask = this.state.selectedTask;

  /** Subtasks of the selected task exposed from the task state service. */
  readonly selectedSubtasks = this.state.selectedSubtasks;

  /** Assigned contacts exposed from the task state service. */
  readonly assignedContacts = this.state.assignedContacts;

  /** Indicates whether a managed task request is running. */
  readonly isLoading = signal(false);

  /** User-facing message describing the latest managed request failure. */
  readonly errorMessage = signal('');

  /**
   * Retrieves all tasks and replaces the local task collection.
   *
   * @returns Mapped tasks in board order.
   * @throws The persistence error returned by the repository.
   */
  getTasks(): Promise<Task[]> {
    return this.execute('Tasks could not be loaded.', async () => {
      const tasks = mapTaskRows(await this.repository.getTaskRows());
      this.state.setTasks(tasks);
      return tasks;
    });
  }

  /**
   * Retrieves and selects a task by its identifier.
   *
   * @param id - Identifier of the requested task.
   * @returns Mapped task or null when the task does not exist.
   * @throws The persistence error returned by the repository.
   */
  getTaskById(id: string): Promise<Task | null> {
    return this.execute('Task could not be loaded.', async () => {
      const row = await this.repository.getTaskRowById(id);
      const task = row ? mapTaskRow(row) : null;
      this.state.selectTask(task);
      return task;
    });
  }

  /**
   * Retrieves subtasks and applies them when their task is selected.
   *
   * @param taskId - Identifier of the parent task.
   * @returns Mapped subtasks belonging to the task.
   * @throws The persistence error returned by the relation service.
   */
  getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
    return this.execute('Subtasks could not be loaded.', async () => {
      const subtasks = await this.relations.getSubtasks(taskId);
      this.state.setSubtasksForTask(taskId, subtasks);
      return subtasks;
    });
  }

  /**
   * Retrieves assignments and applies them when their task is selected.
   *
   * @param taskId - Identifier of the task.
   * @returns Contacts assigned to the task.
   * @throws The persistence error returned by the relation service.
   */
  getAssignedContacts(taskId: string): Promise<Contact[]> {
    return this.execute('Assigned contacts could not be loaded.', async () => {
      const contacts = await this.relations.getAssignedContacts(taskId);
      this.state.setContactsForTask(taskId, contacts);
      return contacts;
    });
  }

  /**
   * Retrieves all relation data required to populate the board.
   *
   * @returns Mapped subtasks and persisted assignment rows.
   * @throws The persistence error returned by the relation service.
   */
  loadAllBoardData(): Promise<BoardRelationsData> {
    return this.relations.loadBoardRelations();
  }

  /**
   * Creates a task and synchronizes the local task state.
   *
   * @param task - Task data to persist.
   * @returns Created application task.
   * @throws The persistence error returned by the repository.
   */
  createTask(task: CreateTask): Promise<Task> {
    return this.execute('Task could not be created.', async () => {
      const createdTask = mapTaskRow(await this.repository.createTask(task));
      this.state.addTask(createdTask);
      this.state.selectTask(createdTask);
      return createdTask;
    });
  }

  /**
   * Creates a task together with its submitted subtasks and assignments.
   *
   * @param input - Task and relation data to persist.
   * @returns Created application task.
   * @throws The persistence error returned during task or relation creation.
   */
  createTaskWithRelations(input: CreateTaskWithRelationsInput): Promise<Task> {
    return this.execute('Task and its relations could not be created.', () =>
      this.createTaskWithRelationsRequest(input),
    );
  }

  /**
   * Updates a task and synchronizes the local task state.
   *
   * @param id - Identifier of the task to update.
   * @param task - Task fields to persist.
   * @returns Updated application task.
   * @throws The persistence error returned by the repository.
   */
  updateTask(id: string, task: UpdateTask): Promise<Task> {
    return this.execute('Task could not be updated.', async () => {
      const updatedTask = mapTaskRow(
        await this.repository.updateTask(id, task),
      );
      this.state.updateTask(updatedTask);
      return updatedTask;
    });
  }

  /**
   * Persists task positions and applies the returned task updates.
   *
   * @param updates - Task status and position updates to persist.
   * @returns A promise that resolves after state synchronization.
   * @throws The persistence error returned by the repository.
   */
  updateTaskPositions(updates: TaskPositionUpdate[]): Promise<void> {
    return this.execute('Task positions could not be saved.', async () => {
      const rows = await this.repository.updateTaskPositions(updates);
      this.state.applyTaskUpdates(mapTaskRows(rows));
    });
  }

  /**
   * Updates a task together with any submitted relation state.
   *
   * @param id - Identifier of the task to update.
   * @param input - Task fields and optional complete relation states.
   * @returns Updated application task.
   * @throws The persistence error returned during task or relation updates.
   */
  updateTaskWithRelations(
    id: string,
    input: UpdateTaskWithRelationsInput,
  ): Promise<Task> {
    return this.execute('Task and its relations could not be updated.', () =>
      this.updateTaskWithRelationsRequest(id, input),
    );
  }

  /**
   * Replaces all subtasks of a task and synchronizes selected state.
   *
   * @param taskId - Identifier of the parent task.
   * @param subtasks - Complete submitted subtask state.
   * @returns Persisted subtasks after replacement.
   * @throws An error when submitted subtask identifiers are invalid.
   * @throws The persistence error returned by the relation service.
   */
  replaceTaskSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<Subtask[]> {
    return this.execute('Task subtasks could not be updated.', async () => {
      const updatedSubtasks = await this.relations.replaceSubtasks(
        taskId,
        subtasks,
      );
      this.state.setSubtasksForTask(taskId, updatedSubtasks);
      return updatedSubtasks;
    });
  }

  /**
   * Deletes a task and removes it from local state.
   *
   * @param id - Identifier of the task to delete.
   * @returns A promise that resolves after deletion.
   * @throws The persistence error returned by the repository.
   */
  deleteTask(id: string): Promise<void> {
    return this.execute('Task could not be deleted.', async () => {
      await this.repository.deleteTask(id);
      this.state.removeTask(id);
    });
  }

  /**
   * Creates a subtask and adds it to selected task state when applicable.
   *
   * @param subtask - Subtask data to persist.
   * @returns Created application subtask.
   * @throws The persistence error returned by the relation service.
   */
  createSubtask(subtask: CreateSubtask): Promise<Subtask> {
    return this.execute('Subtask could not be created.', async () => {
      const createdSubtask = await this.relations.createSubtask(subtask);
      this.state.addSubtask(createdSubtask);
      return createdSubtask;
    });
  }

  /**
   * Updates a subtask and synchronizes selected subtask state.
   *
   * @param id - Identifier of the subtask to update.
   * @param subtask - Subtask fields to persist.
   * @returns Updated application subtask.
   * @throws The persistence error returned by the relation service.
   */
  updateSubtask(id: string, subtask: UpdateSubtask): Promise<Subtask> {
    return this.execute('Subtask could not be updated.', async () => {
      const updatedSubtask = await this.relations.updateSubtask(id, subtask);
      this.state.updateSubtask(updatedSubtask);
      return updatedSubtask;
    });
  }

  /**
   * Persists a subtask completion state.
   *
   * @param id - Identifier of the subtask to update.
   * @param isCompleted - New completion state.
   * @returns Updated application subtask.
   * @throws The persistence error returned by the relation service.
   */
  toggleSubtaskCompletion(id: string, isCompleted: boolean): Promise<Subtask> {
    return this.updateSubtask(id, { isCompleted });
  }

  /**
   * Deletes a subtask and removes it from selected subtask state.
   *
   * @param id - Identifier of the subtask to delete.
   * @returns A promise that resolves after deletion.
   * @throws The persistence error returned by the relation service.
   */
  deleteSubtask(id: string): Promise<void> {
    return this.execute('Subtask could not be deleted.', async () => {
      await this.relations.deleteSubtask(id);
      this.state.removeSubtask(id);
    });
  }

  /**
   * Assigns a contact and synchronizes selected assignment state.
   *
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to assign.
   * @returns Complete assigned contact collection after creation.
   * @throws The persistence error returned by the relation service.
   */
  assignContact(taskId: string, contactId: string): Promise<Contact[]> {
    return this.execute('Contact could not be assigned.', async () => {
      const contacts = await this.relations.assignContact(taskId, contactId);
      this.state.setContactsForTask(taskId, contacts);
      return contacts;
    });
  }

  /**
   * Removes a contact assignment and synchronizes selected assignment state.
   *
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to unassign.
   * @returns Complete assigned contact collection after removal.
   * @throws The persistence error returned by the relation service.
   */
  removeContactAssignment(
    taskId: string,
    contactId: string,
  ): Promise<Contact[]> {
    return this.execute(
      'Contact assignment could not be removed.',
      async () => {
        const contacts = await this.relations.removeContact(taskId, contactId);
        this.state.setContactsForTask(taskId, contacts);
        return contacts;
      },
    );
  }

  /**
   * Replaces all task assignments and synchronizes selected assignment state.
   *
   * @param taskId - Identifier of the task.
   * @param contactIds - Complete submitted contact identifier state.
   * @returns Complete assigned contact collection after replacement.
   * @throws The persistence error returned by the relation service.
   */
  replaceTaskAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<Contact[]> {
    return this.execute(
      'Contact assignments could not be updated.',
      async () => {
        const contacts = await this.relations.replaceAssignments(
          taskId,
          contactIds,
        );
        this.state.setContactsForTask(taskId, contacts);
        return contacts;
      },
    );
  }

  /**
   * Persists a task and its relations with best-effort rollback on failure.
   *
   * @param input - Task and relation data to persist.
   * @returns Created application task.
   * @throws The persistence error returned during task or relation creation.
   */
  private async createTaskWithRelationsRequest(
    input: CreateTaskWithRelationsInput,
  ): Promise<Task> {
    let createdTaskId: string | null = null;

    try {
      const task = mapTaskRow(await this.repository.createTask(input.task));
      createdTaskId = task.id;
      const subtasks = await this.relations.createSubtasksForTask(
        task.id,
        input.subtasks ?? [],
      );
      await this.relations.createAssignments(task.id, input.contactIds ?? []);
      const contacts = await this.relations.getAssignedContacts(task.id);
      this.state.applyCreatedTask(task, subtasks, contacts);
      return task;
    } catch (error) {
      await this.rollbackCreatedTask(createdTaskId);
      throw error;
    }
  }

  /**
   * Persists task and relation updates and refreshes state after failure.
   *
   * @param id - Identifier of the task to update.
   * @param input - Task fields and optional complete relation states.
   * @returns Updated application task.
   * @throws The persistence error returned during task or relation updates.
   */
  private async updateTaskWithRelationsRequest(
    id: string,
    input: UpdateTaskWithRelationsInput,
  ): Promise<Task> {
    try {
      const task = mapTaskRow(await this.repository.updateTask(id, input.task));
      const subtasks = await this.relations.updateOptionalSubtasks(
        id,
        input.subtasks,
      );
      const contacts = await this.relations.updateOptionalAssignments(
        id,
        input.contactIds,
      );
      this.state.applyUpdatedTask(task, subtasks, contacts);
      return task;
    } catch (error) {
      await this.refreshTaskStateAfterFailure(id);
      throw error;
    }
  }

  /**
   * Attempts to delete a partially created task without masking the root error.
   *
   * @param taskId - Identifier of the created task or null before creation.
   * @returns A promise that resolves after the rollback attempt.
   */
  private async rollbackCreatedTask(taskId: string | null): Promise<void> {
    if (!taskId) {
      return;
    }

    try {
      await this.repository.deleteTask(taskId);
    } catch {
      return;
    }
  }

  /**
   * Attempts to restore persisted task state after an update failure.
   *
   * @param taskId - Identifier of the task to refresh.
   * @returns A promise that resolves after the refresh attempt.
   */
  private async refreshTaskStateAfterFailure(taskId: string): Promise<void> {
    try {
      const row = await this.repository.getTaskRowById(taskId);

      if (!row) {
        return;
      }

      const task = mapTaskRow(row);
      const isSelected = this.selectedTask()?.id === taskId;
      this.state.updateTask(task);

      if (isSelected) {
        await this.refreshSelectedRelations(taskId);
      }
    } catch {
      return;
    }
  }

  /**
   * Reloads and applies relations for the selected task.
   *
   * @param taskId - Identifier of the selected task.
   * @returns A promise that resolves after relation state is refreshed.
   * @throws The persistence error returned while loading relations.
   */
  private async refreshSelectedRelations(taskId: string): Promise<void> {
    const [subtaskRows, contacts] = await Promise.all([
      this.repository.getSubtaskRows(taskId),
      this.repository.getAssignedContacts(taskId),
    ]);
    this.state.setSelectedSubtasks(mapSubtaskRows(subtaskRows));
    this.state.setAssignedContacts(contacts);
  }

  /**
   * Executes a task request while maintaining loading and error state.
   *
   * @param message - User-facing message stored when the request fails.
   * @param request - Task operation to execute.
   * @returns Result returned by the request.
   * @throws The original error returned by the request.
   */
  private async execute<T>(
    message: string,
    request: () => Promise<T>,
  ): Promise<T> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      return await request();
    } catch (error) {
      this.errorMessage.set(message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
}