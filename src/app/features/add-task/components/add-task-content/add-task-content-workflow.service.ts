import { Injectable, inject, signal } from '@angular/core';
import { TaskStatus, Task } from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';
import { AddTaskContentState } from './add-task-content-state.service';
import { AddTaskForm, createTaskInput } from './add-task-content.utils';

/** Contains a validated task submission and its success callback. */
interface TaskSubmission {
  /** Valid task creation form. */
  form: AddTaskForm;

  /** Initial workflow status. */
  status: TaskStatus;

  /** Callback invoked after successful creation. */
  onCreated: (task: Task) => void;
}

/** Coordinates loading, persistence, and feedback for one task form. */
@Injectable()
export class AddTaskContentWorkflow {
  private readonly taskService = inject(TaskService);
  private readonly contactService = inject(ContactService);
  private readonly contentState = inject(AddTaskContentState);
  private successTimerId: number | undefined;

  /** Whether initial form data is loading. */
  readonly isLoadingData = signal(false);

  /** Whether task creation is running. */
  readonly isSubmitting = signal(false);

  /** Current form-level error message. */
  readonly errorMessage = signal('');

  /** Current temporary success message. */
  readonly successMessage = signal('');

  /** Loads contacts and tasks required by the form. */
  async loadInitialData(): Promise<void> {
    this.isLoadingData.set(true);
    try {
      await Promise.all([this.loadContacts(), this.loadTasks()]);
    } catch {
      this.errorMessage.set('Form data could not be loaded completely.');
    } finally {
      this.isLoadingData.set(false);
    }
  }

  /**
   * Validates and persists the task form.
   * @param form - Task creation form to submit.
   * @param status - Initial workflow status.
   * @param onCreated - Callback invoked after successful creation.
   * @returns Whether task creation succeeded.
   */
  async submitTask(
    form: AddTaskForm,
    status: TaskStatus,
    onCreated: (task: Task) => void,
  ): Promise<boolean> {
    if (this.isSubmitting()) return false;
    form.markAllAsTouched();
    this.errorMessage.set('');
    if (form.invalid) {
      this.errorMessage.set('Please complete all required fields.');
      return false;
    }
    return this.executeTaskCreation({ form, status, onCreated });
  }

  /**
   * Resets form controls and transient draft state.
   * @param form - Task creation form to reset.
   */
  resetForm(form: AddTaskForm): void {
    form.reset({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      category: '',
    });
    this.contentState.reset();
    this.errorMessage.set('');
  }

  /** Clears resources owned by the workflow. */
  destroy(): void {
    this.clearSuccessTimer();
  }

  /** Loads contacts when the shared collection is empty. */
  private async loadContacts(): Promise<void> {
    if (this.contentState.allContacts().length > 0) return;
    const contacts = await this.contactService.getContacts();
    this.contentState.allContacts.set(contacts);
  }

  /** Loads tasks when the shared collection is empty. */
  private async loadTasks(): Promise<void> {
    if (this.taskService.allTasks().length > 0) return;
    await this.taskService.getTasks();
  }

  /**
   * Persists a task while maintaining submission state.
   * @param submission - Valid form, status, and success callback.
   * @returns Whether task creation succeeded.
   */
  private async executeTaskCreation(submission: TaskSubmission): Promise<boolean> {
    const { form, status, onCreated } = submission;
    this.isSubmitting.set(true);
    try {
      await this.persistTask(form, status, onCreated);
      return true;
    } catch {
      this.errorMessage.set('Task could not be created.');
      return false;
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Persists and applies a successful task creation.
   * @param form - Valid task creation form.
   * @param status - Initial workflow status.
   * @param onCreated - Callback invoked after successful creation.
   */
  private async persistTask(
    form: AddTaskForm,
    status: TaskStatus,
    onCreated: (task: Task) => void,
  ): Promise<void> {
    const input = this.createTaskInput(form, status);
    const task = await this.taskService.createTaskWithRelations(input);
    this.handleCreationSuccess(form);
    onCreated(task);
  }

  /**
   * Creates persistence input from current form and draft state.
   * @param form - Valid task creation form.
   * @param status - Initial workflow status.
   * @returns Task and relation persistence input.
   */
  private createTaskInput(form: AddTaskForm, status: TaskStatus) {
    return createTaskInput(
      form,
      status,
      this.getNextSortOrder(status),
      this.contentState.draftSubtasks(),
      this.contentState.selectedContactIds(),
    );
  }

  /**
   * Calculates the initial position in the target column.
   * @param status - Target workflow status.
   * @returns Number of tasks already in the target column.
   */
  private getNextSortOrder(status: TaskStatus): number {
    return this.taskService.allTasks().filter((task) => task.status === status).length;
  }

  /**
   * Resets the form and displays task creation feedback.
   * @param form - Task creation form to reset.
   */
  private handleCreationSuccess(form: AddTaskForm): void {
    this.resetForm(form);
    this.showSuccessMessage('Task successfully created');
  }

  /**
   * Displays a temporary success message.
   * @param message - Message to display.
   */
  private showSuccessMessage(message: string): void {
    this.clearSuccessTimer();
    this.successMessage.set(message);
    this.successTimerId = window.setTimeout(() => {
      this.successMessage.set('');
    }, 2200);
  }

  /** Clears the active success message timer. */
  private clearSuccessTimer(): void {
    if (this.successTimerId === undefined) return;
    window.clearTimeout(this.successTimerId);
  }
}