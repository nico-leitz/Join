import { Injectable, inject } from '@angular/core';
import { mapSubtaskRow, mapSubtaskRows } from '../mappers/task.mapper';
import { Contact } from '../models/contact.model';
import { CreateSubtask, Subtask, UpdateSubtask } from '../models/subtask.model';
import { CreateTaskSubtaskInput, UpdateTaskSubtaskInput } from '../models/task-persistence.model';
import { BoardRelationsData } from '../models/task-relations.model';
import { TaskRepository } from '../repositories/task.repository';
import { getMissingIds, getUniqueIds, sortSubtasks } from '../utils/task-state.utils';

/**
 * Coordinates persistence operations for task subtasks and assignments.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskRelationsService {
  /** Repository used for task relation persistence. */
  private readonly repository = inject(TaskRepository);

  /**
   * Retrieves all relation data required to populate the task board.
   * @returns Mapped subtasks and persisted task assignment rows.
   * @throws The database error returned by the repository.
   */
  async loadBoardRelations(): Promise<BoardRelationsData> {
    const [subtaskRows, assignments] = await Promise.all([
      this.repository.getAllSubtaskRows(),
      this.repository.getAllAssignmentRows(),
    ]);

    return {
      subtasks: mapSubtaskRows(subtaskRows),
      assignments,
    };
  }

  /**
   * Retrieves all subtasks belonging to a task.
   * @param taskId - Identifier of the parent task.
   * @returns Mapped subtasks belonging to the task.
   * @throws The database error returned by the repository.
   */
  async getSubtasks(taskId: string): Promise<Subtask[]> {
    const rows = await this.repository.getSubtaskRows(taskId);
    return mapSubtaskRows(rows);
  }

  /**
   * Retrieves all contacts assigned to a task.
   * @param taskId - Identifier of the task.
   * @returns Contacts assigned to the task.
   * @throws The database error returned by the repository.
   */
  getAssignedContacts(taskId: string): Promise<Contact[]> {
    return this.repository.getAssignedContacts(taskId);
  }

  /**
   * Creates and maps a subtask.
   * @param subtask - Subtask data to persist.
   * @returns Created application subtask.
   * @throws The database error returned by the repository.
   */
  async createSubtask(subtask: CreateSubtask): Promise<Subtask> {
    const row = await this.repository.createSubtask(subtask);
    return mapSubtaskRow(row);
  }

  /**
   * Updates and maps a subtask.
   * @param id - Identifier of the subtask to update.
   * @param subtask - Subtask fields to persist.
   * @returns Updated application subtask.
   * @throws The database error returned by the repository.
   */
  async updateSubtask(id: string, subtask: UpdateSubtask): Promise<Subtask> {
    const row = await this.repository.updateSubtask(id, subtask);
    return mapSubtaskRow(row);
  }

  /**
   * Deletes a subtask.
   * @param id - Identifier of the subtask to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by the repository.
   */
  deleteSubtask(id: string): Promise<void> {
    return this.repository.deleteSubtask(id);
  }

  /**
   * Creates the submitted subtasks for a newly persisted task.
   * @param taskId - Identifier of the parent task.
   * @param subtasks - Subtasks to create.
   * @returns Created subtasks in their resolved sort order.
   * @throws The database error returned by the repository.
   */
  async createSubtasksForTask(
    taskId: string,
    subtasks: CreateTaskSubtaskInput[],
  ): Promise<Subtask[]> {
    const createdSubtasks: Subtask[] = [];

    for (const [index, subtask] of subtasks.entries()) {
      createdSubtasks.push(await this.createRelatedSubtask(taskId, subtask, index));
    }

    return sortSubtasks(createdSubtasks);
  }

  /**
   * Replaces the complete persisted subtask state of a task.
   * @param taskId - Identifier of the parent task.
   * @param subtasks - Complete submitted subtask state.
   * @returns Persisted subtasks after synchronization.
   * @throws An error when submitted identifiers are invalid.
   * @throws The database error returned by the repository.
   */
  async replaceSubtasks(taskId: string, subtasks: UpdateTaskSubtaskInput[]): Promise<Subtask[]> {
    await this.synchronizeSubtasks(taskId, subtasks);
    return this.getSubtasks(taskId);
  }

  /**
   * Creates unique task assignments for the provided contacts.
   * @param taskId - Identifier of the task.
   * @param contactIds - Identifiers of the contacts to assign.
   * @returns A promise that resolves after assignment creation.
   * @throws The database error returned by the repository.
   */
  async createAssignments(taskId: string, contactIds: string[]): Promise<void> {
    await this.repository.createTaskAssignments(taskId, getUniqueIds(contactIds));
  }

  /**
   * Assigns a contact and returns the refreshed task assignments.
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to assign.
   * @returns Complete assigned contact collection after creation.
   * @throws The database error returned by the repository.
   */
  async assignContact(taskId: string, contactId: string): Promise<Contact[]> {
    await this.repository.createTaskAssignment(taskId, contactId);
    return this.getAssignedContacts(taskId);
  }

  /**
   * Removes a contact assignment and returns the refreshed assignments.
   * @param taskId - Identifier of the task.
   * @param contactId - Identifier of the contact to unassign.
   * @returns Complete assigned contact collection after removal.
   * @throws The database error returned by the repository.
   */
  async removeContact(taskId: string, contactId: string): Promise<Contact[]> {
    await this.repository.deleteTaskAssignment(taskId, contactId);
    return this.getAssignedContacts(taskId);
  }

  /**
   * Replaces the complete persisted assignment state of a task.
   * @param taskId - Identifier of the task.
   * @param contactIds - Complete submitted contact identifier state.
   * @returns Complete assigned contact collection after synchronization.
   * @throws The database error returned by the repository.
   */
  async replaceAssignments(taskId: string, contactIds: string[]): Promise<Contact[]> {
    await this.synchronizeAssignments(taskId, contactIds);
    return this.getAssignedContacts(taskId);
  }

  /**
   * Synchronizes subtasks only when relation data was submitted.
   * @param taskId - Identifier of the parent task.
   * @param subtasks - Submitted subtask state or undefined when unchanged.
   * @returns Updated subtasks or undefined when no update was requested.
   * @throws An error when submitted identifiers are invalid.
   * @throws The database error returned by the repository.
   */
  async updateOptionalSubtasks(
    taskId: string,
    subtasks?: UpdateTaskSubtaskInput[],
  ): Promise<Subtask[] | undefined> {
    return subtasks === undefined ? undefined : this.replaceSubtasks(taskId, subtasks);
  }

  /**
   * Synchronizes assignments only when relation data was submitted.
   * @param taskId - Identifier of the task.
   * @param contactIds - Submitted contact identifiers or undefined when unchanged.
   * @returns Updated contacts or undefined when no update was requested.
   * @throws The database error returned by the repository.
   */
  async updateOptionalAssignments(
    taskId: string,
    contactIds?: string[],
  ): Promise<Contact[] | undefined> {
    return contactIds === undefined ? undefined : this.replaceAssignments(taskId, contactIds);
  }

  /**
   * Persists the submitted subtask state and removes omitted subtasks.
   * @param taskId - Identifier of the parent task.
   * @param subtasks - Complete submitted subtask state.
   * @returns A promise that resolves after synchronization.
   * @throws An error when submitted identifiers are invalid.
   * @throws The database error returned by the repository.
   */
  private async synchronizeSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<void> {
    const currentRows = await this.repository.getSubtaskRows(taskId);
    const currentIds = currentRows.map((subtask) => subtask.id);
    const requestedIds = this.getRequestedSubtaskIds(subtasks);

    this.validateRequestedSubtaskIds(currentIds, requestedIds);
    await this.persistSubtasks(taskId, subtasks);

    await this.repository.deleteTaskSubtasks(taskId, getMissingIds(currentIds, requestedIds));
  }

  /**
   * Creates or updates every submitted subtask in sequence.
   * @param taskId - Identifier of the parent task.
   * @param subtasks - Subtasks to persist.
   * @returns A promise that resolves after all subtasks are persisted.
   * @throws The database error returned by the repository.
   */
  private async persistSubtasks(taskId: string, subtasks: UpdateTaskSubtaskInput[]): Promise<void> {
    for (const [index, subtask] of subtasks.entries()) {
      await this.persistSubtask(taskId, subtask, index);
    }
  }

  /**
   * Creates a new subtask or updates an identified existing subtask.
   * @param taskId - Identifier of the parent task.
   * @param subtask - Submitted subtask data.
   * @param index - Submitted position used as the default sort order.
   * @returns A promise that resolves after persistence.
   * @throws The database error returned by the repository.
   */
  private async persistSubtask(
    taskId: string,
    subtask: UpdateTaskSubtaskInput,
    index: number,
  ): Promise<void> {
    if (subtask.id) {
      const update = this.createSubtaskUpdate(subtask, index);
      await this.repository.updateTaskSubtask(taskId, subtask.id, update);
      return;
    }

    const sortOrder = subtask.sortOrder ?? index;
    await this.repository.createSubtask({ taskId, title: subtask.title, sortOrder });
  }

  /**
   * Creates an update payload from submitted subtask data.
   * @param subtask - Submitted subtask data.
   * @param index - Submitted position used as the default sort order.
   * @returns Subtask update payload.
   */
  private createSubtaskUpdate(subtask: UpdateTaskSubtaskInput, index: number): UpdateSubtask {
    return {
      title: subtask.title,
      sortOrder: subtask.sortOrder ?? index,
      ...(subtask.isCompleted !== undefined && {
        isCompleted: subtask.isCompleted,
      }),
    };
  }

  /**
   * Creates a subtask associated with the provided task.
   * @param taskId - Identifier of the parent task.
   * @param subtask - Subtask data submitted with task creation.
   * @param index - Submitted position used as the default sort order.
   * @returns Created application subtask.
   * @throws The database error returned by the repository.
   */
  private async createRelatedSubtask(
    taskId: string,
    subtask: CreateTaskSubtaskInput,
    index: number,
  ): Promise<Subtask> {
    return this.createSubtask({
      taskId,
      title: subtask.title,
      sortOrder: subtask.sortOrder ?? index,
    });
  }

  /**
   * Extracts the identifiers of submitted existing subtasks.
   * @param subtasks - Submitted subtask state.
   * @returns Identifiers present in the submitted subtask state.
   */
  private getRequestedSubtaskIds(subtasks: UpdateTaskSubtaskInput[]): string[] {
    return subtasks.flatMap((subtask) => (subtask.id ? [subtask.id] : []));
  }

  /**
   * Validates uniqueness and ownership of submitted subtask identifiers.
   * @param currentIds - Identifiers currently belonging to the task.
   * @param requestedIds - Existing identifiers included in the submission.
   * @throws An error when identifiers are duplicated or belong to another task.
   */
  private validateRequestedSubtaskIds(currentIds: string[], requestedIds: string[]): void {
    const uniqueIds = getUniqueIds(requestedIds);

    if (uniqueIds.length !== requestedIds.length) {
      throw new Error('Duplicate subtask IDs are not allowed.');
    }

    if (getMissingIds(uniqueIds, currentIds).length > 0) {
      throw new Error('Subtask does not belong to this task.');
    }
  }

  /**
   * Persists only the assignment differences between current and requested state.
   * @param taskId - Identifier of the task.
   * @param contactIds - Complete submitted contact identifier state.
   * @returns A promise that resolves after assignment synchronization.
   * @throws The database error returned by the repository.
   */
  private async synchronizeAssignments(taskId: string, contactIds: string[]): Promise<void> {
    const currentIds = await this.repository.getAssignedContactIds(taskId);
    const requestedIds = getUniqueIds(contactIds);
    const removedIds = getMissingIds(currentIds, requestedIds);
    const addedIds = getMissingIds(requestedIds, currentIds);

    await this.repository.deleteTaskAssignments(taskId, removedIds);
    await this.repository.createTaskAssignments(taskId, addedIds);
  }
}