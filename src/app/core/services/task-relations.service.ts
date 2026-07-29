import { Injectable, inject } from '@angular/core';
import { mapSubtaskRow, mapSubtaskRows } from '../mappers/task.mapper';
import { Contact } from '../models/contact.model';
import { CreateSubtask, Subtask, UpdateSubtask } from '../models/subtask.model';
import {
  CreateTaskSubtaskInput,
  UpdateTaskSubtaskInput,
} from '../models/task-persistence.model';
import { BoardRelationsData } from '../models/task-relations.model';
import { TaskRepository } from '../repositories/task.repository';
import {
  getMissingIds,
  getUniqueIds,
  sortSubtasks,
} from '../utils/task-state.utils';

@Injectable({
  providedIn: 'root',
})
export class TaskRelationsService {
  private readonly repository = inject(TaskRepository);

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

  async getSubtasks(taskId: string): Promise<Subtask[]> {
    const rows = await this.repository.getSubtaskRows(taskId);
    return mapSubtaskRows(rows);
  }

  getAssignedContacts(taskId: string): Promise<Contact[]> {
    return this.repository.getAssignedContacts(taskId);
  }

  async createSubtask(subtask: CreateSubtask): Promise<Subtask> {
    const row = await this.repository.createSubtask(subtask);
    return mapSubtaskRow(row);
  }

  async updateSubtask(id: string, subtask: UpdateSubtask): Promise<Subtask> {
    const row = await this.repository.updateSubtask(id, subtask);
    return mapSubtaskRow(row);
  }

  deleteSubtask(id: string): Promise<void> {
    return this.repository.deleteSubtask(id);
  }

  async createSubtasksForTask(
    taskId: string,
    subtasks: CreateTaskSubtaskInput[],
  ): Promise<Subtask[]> {
    const createdSubtasks: Subtask[] = [];

    for (const [index, subtask] of subtasks.entries()) {
      createdSubtasks.push(
        await this.createRelatedSubtask(taskId, subtask, index),
      );
    }

    return sortSubtasks(createdSubtasks);
  }

  async replaceSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<Subtask[]> {
    await this.synchronizeSubtasks(taskId, subtasks);
    return this.getSubtasks(taskId);
  }

  async createAssignments(taskId: string, contactIds: string[]): Promise<void> {
    await this.repository.createTaskAssignments(
      taskId,
      getUniqueIds(contactIds),
    );
  }

  async assignContact(taskId: string, contactId: string): Promise<Contact[]> {
    await this.repository.createTaskAssignment(taskId, contactId);
    return this.getAssignedContacts(taskId);
  }

  async removeContact(taskId: string, contactId: string): Promise<Contact[]> {
    await this.repository.deleteTaskAssignment(taskId, contactId);
    return this.getAssignedContacts(taskId);
  }

  async replaceAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<Contact[]> {
    await this.synchronizeAssignments(taskId, contactIds);
    return this.getAssignedContacts(taskId);
  }

  async updateOptionalSubtasks(
    taskId: string,
    subtasks?: UpdateTaskSubtaskInput[],
  ): Promise<Subtask[] | undefined> {
    return subtasks === undefined
      ? undefined
      : this.replaceSubtasks(taskId, subtasks);
  }

  async updateOptionalAssignments(
    taskId: string,
    contactIds?: string[],
  ): Promise<Contact[] | undefined> {
    return contactIds === undefined
      ? undefined
      : this.replaceAssignments(taskId, contactIds);
  }

  private async synchronizeSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<void> {
    const currentRows = await this.repository.getSubtaskRows(taskId);
    const currentIds = currentRows.map((subtask) => subtask.id);
    const requestedIds = this.getRequestedSubtaskIds(subtasks);

    this.validateRequestedSubtaskIds(currentIds, requestedIds);
    await this.persistSubtasks(taskId, subtasks);

    await this.repository.deleteTaskSubtasks(
      taskId,
      getMissingIds(currentIds, requestedIds),
    );
  }

  private async persistSubtasks(
    taskId: string,
    subtasks: UpdateTaskSubtaskInput[],
  ): Promise<void> {
    for (const [index, subtask] of subtasks.entries()) {
      await this.persistSubtask(taskId, subtask, index);
    }
  }

  private async persistSubtask(
    taskId: string,
    subtask: UpdateTaskSubtaskInput,
    index: number,
  ): Promise<void> {
    if (subtask.id) {
      await this.repository.updateTaskSubtask(
        taskId,
        subtask.id,
        this.createSubtaskUpdate(subtask, index),
      );
      return;
    }

    await this.repository.createSubtask({
      taskId,
      title: subtask.title,
      sortOrder: subtask.sortOrder ?? index,
    });
  }

  private createSubtaskUpdate(
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

  private getRequestedSubtaskIds(subtasks: UpdateTaskSubtaskInput[]): string[] {
    return subtasks.flatMap((subtask) => (subtask.id ? [subtask.id] : []));
  }

  private validateRequestedSubtaskIds(
    currentIds: string[],
    requestedIds: string[],
  ): void {
    const uniqueIds = getUniqueIds(requestedIds);

    if (uniqueIds.length !== requestedIds.length) {
      throw new Error('Duplicate subtask IDs are not allowed.');
    }

    if (getMissingIds(uniqueIds, currentIds).length > 0) {
      throw new Error('Subtask does not belong to this task.');
    }
  }

  private async synchronizeAssignments(
    taskId: string,
    contactIds: string[],
  ): Promise<void> {
    const currentIds = await this.repository.getAssignedContactIds(taskId);
    const requestedIds = getUniqueIds(contactIds);

    await this.repository.deleteTaskAssignments(
      taskId,
      getMissingIds(currentIds, requestedIds),
    );
    await this.repository.createTaskAssignments(
      taskId,
      getMissingIds(requestedIds, currentIds),
    );
  }
}
