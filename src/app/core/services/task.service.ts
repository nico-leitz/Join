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

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly repository = inject(TaskRepository);
  private readonly relations = inject(TaskRelationsService);
  private readonly state = inject(TaskStateService);

  readonly allTasks = this.state.allTasks;
  readonly selectedTask = this.state.selectedTask;
  readonly selectedSubtasks = this.state.selectedSubtasks;
  readonly assignedContacts = this.state.assignedContacts;
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  getTasks(): Promise<Task[]> {
    return this.execute('Tasks could not be loaded.', async () => {
      const tasks = mapTaskRows(await this.repository.getTaskRows());
      this.state.setTasks(tasks);
      return tasks;
    });
  }

  getTaskById(id: string): Promise<Task | null> {
    return this.execute('Task could not be loaded.', async () => {
      const row = await this.repository.getTaskRowById(id);
      const task = row ? mapTaskRow(row) : null;
      this.state.selectTask(task);
      return task;
    });
  }

  getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
    return this.execute('Subtasks could not be loaded.', async () => {
      const subtasks = await this.relations.getSubtasks(taskId);
      this.state.setSubtasksForTask(taskId, subtasks);
      return subtasks;
    });
  }

  getAssignedContacts(taskId: string): Promise<Contact[]> {
    return this.execute('Assigned contacts could not be loaded.', async () => {
      const contacts = await this.relations.getAssignedContacts(taskId);
      this.state.setContactsForTask(taskId, contacts);
      return contacts;
    });
  }

  loadAllBoardData(): Promise<BoardRelationsData> {
    return this.relations.loadBoardRelations();
  }

  createTask(task: CreateTask): Promise<Task> {
    return this.execute('Task could not be created.', async () => {
      const createdTask = mapTaskRow(await this.repository.createTask(task));
      this.state.addTask(createdTask);
      this.state.selectTask(createdTask);
      return createdTask;
    });
  }

  createTaskWithRelations(input: CreateTaskWithRelationsInput): Promise<Task> {
    return this.execute('Task and its relations could not be created.', () =>
      this.createTaskWithRelationsRequest(input),
    );
  }

  updateTask(id: string, task: UpdateTask): Promise<Task> {
    return this.execute('Task could not be updated.', async () => {
      const updatedTask = mapTaskRow(
        await this.repository.updateTask(id, task),
      );
      this.state.updateTask(updatedTask);
      return updatedTask;
    });
  }

  updateTaskPositions(updates: TaskPositionUpdate[]): Promise<void> {
    return this.execute('Task positions could not be saved.', async () => {
      const rows = await this.repository.updateTaskPositions(updates);
      this.state.applyTaskUpdates(mapTaskRows(rows));
    });
  }

  updateTaskWithRelations(
    id: string,
    input: UpdateTaskWithRelationsInput,
  ): Promise<Task> {
    return this.execute('Task and its relations could not be updated.', () =>
      this.updateTaskWithRelationsRequest(id, input),
    );
  }

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

  deleteTask(id: string): Promise<void> {
    return this.execute('Task could not be deleted.', async () => {
      await this.repository.deleteTask(id);
      this.state.removeTask(id);
    });
  }

  createSubtask(subtask: CreateSubtask): Promise<Subtask> {
    return this.execute('Subtask could not be created.', async () => {
      const createdSubtask = await this.relations.createSubtask(subtask);
      this.state.addSubtask(createdSubtask);
      return createdSubtask;
    });
  }

  updateSubtask(id: string, subtask: UpdateSubtask): Promise<Subtask> {
    return this.execute('Subtask could not be updated.', async () => {
      const updatedSubtask = await this.relations.updateSubtask(id, subtask);
      this.state.updateSubtask(updatedSubtask);
      return updatedSubtask;
    });
  }

  toggleSubtaskCompletion(id: string, isCompleted: boolean): Promise<Subtask> {
    return this.updateSubtask(id, { isCompleted });
  }

  deleteSubtask(id: string): Promise<void> {
    return this.execute('Subtask could not be deleted.', async () => {
      await this.relations.deleteSubtask(id);
      this.state.removeSubtask(id);
    });
  }

  assignContact(taskId: string, contactId: string): Promise<Contact[]> {
    return this.execute('Contact could not be assigned.', async () => {
      const contacts = await this.relations.assignContact(taskId, contactId);
      this.state.setContactsForTask(taskId, contacts);
      return contacts;
    });
  }

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

  private async refreshSelectedRelations(taskId: string): Promise<void> {
    const [subtaskRows, contacts] = await Promise.all([
      this.repository.getSubtaskRows(taskId),
      this.repository.getAssignedContacts(taskId),
    ]);
    this.state.setSelectedSubtasks(mapSubtaskRows(subtaskRows));
    this.state.setAssignedContacts(contacts);
  }

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
