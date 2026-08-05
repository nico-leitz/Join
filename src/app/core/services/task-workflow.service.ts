import { Injectable, inject } from '@angular/core';
import { mapSubtaskRows, mapTaskRow } from '../mappers/task.mapper';
import {
  CreateTaskWithRelationsInput,
  UpdateTaskWithRelationsInput,
} from '../models/task-persistence.model';
import { Task } from '../models/task.model';
import { TaskRepository } from '../repositories/task.repository';
import { TaskRelationsService } from './task-relations.service';
import { TaskStateService } from './task-state.service';

/**
 * Coordinates multi-step task persistence and recovery workflows.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskWorkflowService {
  /** Repository used for task persistence requests. */
  private readonly repository = inject(TaskRepository);

  /** Service used for subtask and assignment operations. */
  private readonly relations = inject(TaskRelationsService);

  /** Service owning the in-memory task state. */
  private readonly state = inject(TaskStateService);

  /**
   * Persists a task and its relations with best-effort rollback on failure.
   * @param input - Task and relation data to persist.
   * @returns Created application task.
   * @throws The persistence error returned during task or relation creation.
   */
  async createTaskWithRelations(input: CreateTaskWithRelationsInput): Promise<Task> {
    let taskId: string | null = null;

    try {
      const task = mapTaskRow(await this.repository.createTask(input.task));
      taskId = task.id;
      await this.persistCreatedRelations(task, input);
      return task;
    } catch (error) {
      await this.rollbackCreatedTask(taskId);
      throw error;
    }
  }

  /**
   * Persists task and relation updates and refreshes state after failure.
   * @param id - Identifier of the task to update.
   * @param input - Task fields and optional complete relation states.
   * @returns Updated application task.
   * @throws The persistence error returned during task or relation updates.
   */
  async updateTaskWithRelations(id: string, input: UpdateTaskWithRelationsInput): Promise<Task> {
    try {
      return await this.persistUpdatedTask(id, input);
    } catch (error) {
      await this.refreshTaskStateAfterFailure(id);
      throw error;
    }
  }

  /**
   * Creates and applies all submitted relations for a persisted task.
   * @param task - Persisted application task.
   * @param input - Task and relation data to persist.
   * @returns A promise that resolves after relation state is synchronized.
   * @throws The persistence error returned during task or relation creation.
   */
  private async persistCreatedRelations(
    task: Task,
    input: CreateTaskWithRelationsInput,
  ): Promise<void> {
    const subtasks = await this.relations.createSubtasksForTask(task.id, input.subtasks ?? []);
    await this.relations.createAssignments(task.id, input.contactIds ?? []);
    const contacts = await this.relations.getAssignedContacts(task.id);
    this.state.applyCreatedTask(task, subtasks, contacts);
  }

  /**
   * Updates and applies a task together with submitted relation states.
   * @param id - Identifier of the task to update.
   * @param input - Task and relation updates to persist.
   * @returns Updated application task.
   * @throws The persistence error returned during task or relation updates.
   */
  private async persistUpdatedTask(id: string, input: UpdateTaskWithRelationsInput): Promise<Task> {
    const task = mapTaskRow(await this.repository.updateTask(id, input.task));
    const subtasks = await this.relations.updateOptionalSubtasks(id, input.subtasks);
    const contacts = await this.relations.updateOptionalAssignments(id, input.contactIds);
    this.state.applyUpdatedTask(task, subtasks, contacts);
    return task;
  }

  /**
   * Attempts to delete a partially created task without masking the root error.
   * @param taskId - Identifier of the created task or null before creation.
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
   * @param taskId - Identifier of the task to refresh.
   */
  private async refreshTaskStateAfterFailure(taskId: string): Promise<void> {
    try {
      await this.restoreTaskState(taskId);
    } catch {
      return;
    }
  }

  /**
   * Reloads a task and its selected relations from persistence.
   * @param taskId - Identifier of the task to restore.
   */
  private async restoreTaskState(taskId: string): Promise<void> {
    const row = await this.repository.getTaskRowById(taskId);
    if (!row) {
      return;
    }

    const isSelected = this.state.selectedTask()?.id === taskId;
    this.state.updateTask(mapTaskRow(row));
    if (isSelected) {
      await this.refreshSelectedRelations(taskId);
    }
  }

  /**
   * Reloads and applies relations for the selected task.
   * @param taskId - Identifier of the selected task.
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
}