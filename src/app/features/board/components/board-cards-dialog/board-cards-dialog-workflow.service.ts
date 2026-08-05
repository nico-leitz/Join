import { Injectable, inject } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import {
  UpdateTaskSubtaskInput,
  UpdateTaskWithRelationsInput,
} from '../../../../core/models/task-persistence.model';
import { Task, TaskCategory, TaskPriority } from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { EditableSubtask } from './board-cards-dialog-state.service';

/** Raw edit form value consumed by task persistence. */
export interface BoardDialogFormValue {
  /** Edited task title. */
  title: string;
  /** Edited task description. */
  description: string;
  /** Edited due date. */
  dueDate: string;
  /** Edited task priority. */
  priority: TaskPriority;
  /** Edited task category. */
  category: TaskCategory;
}

/** Complete task and relation state returned after persistence. */
export interface BoardDialogUpdateResult {
  /** Updated task data. */
  task: Task;
  /** Complete persisted subtask state. */
  subtasks: Subtask[];
  /** Complete persisted contact assignment state. */
  assignedContacts: Contact[];
}

/** Coordinates task, subtask and assignment persistence for the dialog. */
@Injectable()
export class BoardCardsDialogWorkflowService {
  /** Service used for task, subtask and assignment persistence. */
  private readonly taskService = inject(TaskService);

  /**
   * Persists a changed subtask completion state.
   * @param subtaskId - Identifier of the subtask to update.
   * @param isCompleted - Requested completion state.
   * @returns Persisted subtask state.
   */
  toggleSubtask(subtaskId: string, isCompleted: boolean): Promise<Subtask> {
    return this.taskService.toggleSubtaskCompletion(subtaskId, isCompleted);
  }

  /**
   * Deletes the task with the requested identifier.
   * @param taskId - Identifier of the task to delete.
   * @returns Promise that resolves after deletion.
   */
  deleteTask(taskId: string): Promise<void> {
    return this.taskService.deleteTask(taskId);
  }

  /**
   * Persists a task edit and returns its synchronized relation state.
   * @param taskId - Identifier of the task to update.
   * @param formValue - Current raw edit form value.
   * @param subtasks - Complete editable subtask collection.
   * @param contactIds - Complete selected contact identifiers.
   * @returns Updated task and relation state.
   */
  async updateTask(
    taskId: string,
    formValue: BoardDialogFormValue,
    subtasks: EditableSubtask[],
    contactIds: string[],
  ): Promise<BoardDialogUpdateResult> {
    const updateInput = this.createUpdateInput(formValue, subtasks, contactIds);
    const task = await this.taskService.updateTaskWithRelations(taskId, updateInput);
    return this.createUpdateResult(task);
  }

  /**
   * Creates the complete task and relation persistence payload.
   * @param formValue - Current raw edit form value.
   * @param subtasks - Complete editable subtask collection.
   * @param contactIds - Complete selected contact identifiers.
   * @returns Persistence payload for the task service.
   */
  private createUpdateInput(
    formValue: BoardDialogFormValue,
    subtasks: EditableSubtask[],
    contactIds: string[],
  ): UpdateTaskWithRelationsInput {
    return {
      task: this.createTaskInput(formValue),
      subtasks: this.createSubtaskPayload(subtasks),
      contactIds: [...contactIds],
    };
  }

  /**
   * Trims user-entered task text while preserving selection values.
   * @param formValue - Current raw edit form value.
   * @returns Normalized task field update.
   */
  private createTaskInput(formValue: BoardDialogFormValue) {
    return {
      title: formValue.title.trim(),
      description: formValue.description.trim(),
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
    };
  }

  /**
   * Maps editable subtasks to the persistence input format.
   * @param subtasks - Editable subtasks to normalize.
   * @returns Complete ordered subtask update state.
   */
  private createSubtaskPayload(subtasks: EditableSubtask[]): UpdateTaskSubtaskInput[] {
    return subtasks.map((subtask, index) => ({
      ...(subtask.id && { id: subtask.id }),
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
      sortOrder: index,
    }));
  }

  /**
   * Creates the output state exposed after successful persistence.
   * @param task - Persisted task returned by the task service.
   * @returns Updated task and synchronized relation state.
   */
  private createUpdateResult(task: Task): BoardDialogUpdateResult {
    return {
      task,
      subtasks: [...this.taskService.selectedSubtasks()],
      assignedContacts: [...this.taskService.assignedContacts()],
    };
  }
}