import {
  Injectable,
  inject,
  signal,
} from '@angular/core';
import { Contact } from '../../../core/models/contact.model';
import { Subtask } from '../../../core/models/subtask.model';
import { Task } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { replaceBoardSubtask } from '../utils/board-data.utils';

/**
 * Owns the task detail dialog state and shared task selection.
 */
@Injectable()
export class BoardDialogStateService {
  /** Service whose selected task relations are used during editing. */
  private readonly taskService =
    inject(TaskService);

  /** Indicates whether the task detail dialog is open. */
  readonly isOpen =
    signal(false);

  /** Task currently displayed by the dialog. */
  readonly task =
    signal<Task | null>(null);

  /** Subtasks currently displayed by the dialog. */
  readonly subtasks =
    signal<Subtask[]>([]);

  /** Assigned contacts currently displayed by the dialog. */
  readonly contacts =
    signal<Contact[]>([]);

  /**
   * Opens the dialog and exposes its task selection to editing.
   *
   * @param task - Task to display.
   * @param subtasks - Subtasks belonging to the task.
   * @param contacts - Contacts assigned to the task.
   */
  open(
    task: Task,
    subtasks: Subtask[],
    contacts: Contact[],
  ): void {
    this.setDialogData(
      task,
      subtasks,
      contacts,
    );

    this.setSelection(
      task,
      subtasks,
      contacts,
    );

    this.isOpen.set(true);
  }

  /**
   * Closes the dialog and clears all task selection state.
   */
  close(): void {
    this.isOpen.set(false);

    this.setDialogData(
      null,
      [],
      [],
    );

    this.clearSelection();
  }

  /**
   * Replaces the task and relations displayed after a save.
   *
   * @param task - Updated task to display.
   * @param subtasks - Complete updated subtask state.
   * @param contacts - Complete updated assignment state.
   */
  update(
    task: Task,
    subtasks: Subtask[],
    contacts: Contact[],
  ): void {
    this.setDialogData(
      task,
      subtasks,
      contacts,
    );
  }

  /**
   * Replaces a changed subtask in the open dialog.
   *
   * @param updatedSubtask - Persisted subtask containing the new state.
   */
  updateSubtask(
    updatedSubtask: Subtask,
  ): void {
    this.subtasks.update(
      (subtasks) => {
        return replaceBoardSubtask(
          subtasks,
          updatedSubtask,
        );
      },
    );
  }

  /**
   * Clears task selection shared through the task service.
   */
  clearSelection(): void {
    this.taskService
      .selectedTask
      .set(null);

    this.taskService
      .selectedSubtasks
      .set([]);

    this.taskService
      .assignedContacts
      .set([]);
  }

  /**
   * Replaces all values rendered by the task dialog.
   *
   * @param task - Task to display or null to clear the dialog.
   * @param subtasks - Subtasks to display.
   * @param contacts - Assigned contacts to display.
   */
  private setDialogData(
    task: Task | null,
    subtasks: Subtask[],
    contacts: Contact[],
  ): void {
    this.task.set(task);

    this.subtasks.set(
      subtasks,
    );

    this.contacts.set(
      contacts,
    );
  }

  /**
   * Exposes the current task selection to task editing.
   *
   * @param task - Selected task.
   * @param subtasks - Selected task subtasks.
   * @param contacts - Selected task contacts.
   */
  private setSelection(
    task: Task,
    subtasks: Subtask[],
    contacts: Contact[],
  ): void {
    this.taskService
      .selectedTask
      .set(task);

    this.taskService
      .selectedSubtasks
      .set(subtasks);

    this.taskService
      .assignedContacts
      .set(contacts);
  }
}