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

@Injectable()
export class BoardDialogStateService {
  private readonly taskService =
    inject(TaskService);

  readonly isOpen = signal(false);

  readonly task = signal<Task | null>(null);

  readonly subtasks = signal<Subtask[]>([]);

  readonly contacts = signal<Contact[]>([]);

  /**
   * Opens the task dialog and exposes its data to editing.
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
   * Closes the task dialog and clears its selection state.
   */
  close(): void {
    this.isOpen.set(false);
    this.setDialogData(null, [], []);
    this.clearSelection();
  }

  /**
   * Replaces the dialog data after a task was saved.
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
   * Replaces one changed subtask in the open dialog.
   */
  updateSubtask(
    updatedSubtask: Subtask,
  ): void {
    this.subtasks.update((subtasks) => {
      return replaceBoardSubtask(
        subtasks,
        updatedSubtask,
      );
    });
  }

  /**
   * Clears the selection shared through the task service.
   */
  clearSelection(): void {
    this.taskService.selectedTask.set(null);

    this.taskService.selectedSubtasks.set([]);

    this.taskService.assignedContacts.set([]);
  }

  /**
   * Replaces all values rendered by the task dialog.
   */
  private setDialogData(
    task: Task | null,
    subtasks: Subtask[],
    contacts: Contact[],
  ): void {
    this.task.set(task);
    this.subtasks.set(subtasks);
    this.contacts.set(contacts);
  }

  /**
   * Exposes the current task selection to dialog editing.
   */
  private setSelection(
    task: Task,
    subtasks: Subtask[],
    contacts: Contact[],
  ): void {
    this.taskService.selectedTask.set(task);

    this.taskService.selectedSubtasks.set(
      subtasks,
    );

    this.taskService.assignedContacts.set(
      contacts,
    );
  }
}