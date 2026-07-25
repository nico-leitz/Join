import { DOCUMENT } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';
import { UpdateTaskSubtaskInput } from '../../../../core/models/task-persistence.model';
import { Subtask } from '../../../../core/models/subtask.model';
import {
  Task,
  TaskCategory,
  TaskPriority,
} from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { SlicePipe } from '@angular/common';

/**
 * Data structure representing the payload emitted when a task is updated.
 * @public
 */
export interface TaskDialogUpdate {
  task: Task;
  subtasks: Subtask[];
  assignedContacts: Contact[];
}

/**
 * Internal interface representing a subtask in an editable state.
 * @internal
 */
interface EditableSubtask {
  id?: string;
  title: string;
  isCompleted: boolean;
}

/**
 * Component for displaying, editing, and managing task details within a modal dialog.
 * 
 * @remarks
 * This component provides an interface to view task details, update task properties
 * (title, description, priority, etc.), manage subtasks, and assign contacts.
 * It also handles the lifecycle of deleting tasks and updating task persistence.
 * 
 * @public
 */
@Component({
  selector: 'app-board-cards-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, SlicePipe],
  templateUrl: './board-cards-dialog.html',
  styleUrl: './board-cards-dialog.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeContactsMenu()',
  },
})
export class BoardCardsDialog implements OnInit, OnDestroy {
  /** @internal Duration of the closing animation in milliseconds. */
  private readonly closeAnimationMs = 200;

  /** @internal Reference to the browser document object. */
  private readonly document = inject(DOCUMENT);

  /** @internal Service for handling task-related persistence and state. */
  private readonly taskService = inject(TaskService);

  /** @internal Form builder for creating reactive forms. */
  private readonly formBuilder = inject(FormBuilder);

  /** @internal Stores original scroll state to restore after dialog closure. */
  private previousBodyOverflow = '';
  private previousHtmlOverflow = '';
  
  /** @internal ID for the dialog close timeout. */
  private closeTimerId: number | undefined;

  /** The task data to be displayed/edited. Required input. */
  readonly task = input.required<Task>();

  /** List of subtasks associated with the task. */
  readonly subtasks = input<Subtask[]>([]);

  /** List of contacts currently assigned to the task. */
  readonly assignedContacts = input<Contact[]>([]);

  /** List of all available contacts for selection. */
  readonly availableContacts = input<Contact[]>([]);

  /** Emitted when the dialog is closed. */
  readonly dialogClosed = output<void>();

  /** Emitted when a specific subtask is updated. */
  readonly subtaskUpdated = output<Subtask>();

  /** Emitted when the task is deleted, passing the task ID. */
  readonly taskDeleted = output<string>();

  /** Emitted when the task is updated successfully. */
  readonly taskUpdated = output<TaskDialogUpdate>();

  /** Signals representing the current UI state of the dialog. */
  readonly isClosing = signal(false);
  readonly isDeleting = signal(false);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);

  /** Tracks the visibility state of the contact assignment menu. */
  readonly contactsMenuOpen = signal(false);

  /** Tracks which subtask is currently being toggled. */
  readonly updatingSubtaskId = signal<string | null>(null);

  /** Tracks the IDs of selected contacts during editing. */
  readonly selectedContactIds = signal<string[]>([]);

  /** Stores local state of subtasks during edit mode. */
  readonly editableSubtasks = signal<EditableSubtask[]>([]);

  /** Stores the title of a new subtask being drafted. */
  readonly newSubtaskTitle = signal('');

  /** Stores error messages to display in the UI. */
  readonly errorMessage = signal('');

  /** Reactive form group for task data. */
  readonly editForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(1000)],
    dueDate: ['', Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    category: ['user_story' as TaskCategory, Validators.required],
  });

  /** Computed label for the task category. */
  readonly categoryLabel = computed(() => {
    return this.task().category === 'technical_task' ? 'Technical Task' : 'User Story';
  });

  /** Computed label for the task priority. */
  readonly priorityLabel = computed(() => {
    const priority = this.task().priority;
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  });

  /** Computed string for the formatted due date. */
  readonly formattedDueDate = computed(() => {
    return formatDueDate(this.task().dueDate);
  });

  /** Computed list of contact objects based on selected IDs. */
  readonly selectedContacts = computed(() => {
    const selectedIds = new Set(this.selectedContactIds());
    return this.availableContacts().filter((contact) => selectedIds.has(contact.id));
  });

  /** Computed label displaying the count of selected contacts. */
  readonly contactSelectionLabel = computed(() => {
    const selectedAmount = this.selectedContactIds().length;
    if (selectedAmount === 0) return 'Select contacts to assign';
    if (selectedAmount === 1) return '1 contact selected';
    return `${selectedAmount} contacts selected`;
  });

  /** @public Lifecycle hook: Initializes page scroll locking. */
  ngOnInit(): void {
    this.lockPageScroll();
  }

  /** @public Lifecycle hook: Cleans up timers and restores page scrolling. */
  ngOnDestroy(): void {
    this.clearCloseTimer();
    this.restorePageScroll();
  }

  /**
   * Initiates the dialog closing sequence with an animation delay.
   * @public
   */
  closeDialog(): void {
    if (this.isClosing() || this.isSaving()) return;

    this.isClosing.set(true);
    this.closeTimerId = window.setTimeout(() => {
      this.dialogClosed.emit();
    }, this.closeAnimationMs);
  }

  /** @protected Handles dialog interactions to manage contact menu visibility. */
  protected handleDialogClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.contactsMenuOpen()) return;

    const target = event.target;
    if (!(target instanceof Element)) {
      this.closeContactsMenu();
      return;
    }

    const contactSelect = target.closest('.board_dialog__contact_select');
    if (!contactSelect) this.closeContactsMenu();
  }

  /** @protected Listens for clicks outside the dialog to close the contact menu. */
  protected onDocumentClick(event: Event): void {
    if (!this.contactsMenuOpen()) return;

    const target = event.target;
    if (!(target instanceof Element)) {
      this.closeContactsMenu();
      return;
    }

    const contactSelect = target.closest('.board_dialog__contact_select');
    if (!contactSelect) this.closeContactsMenu();
  }

  /** @protected Closes the contact assignment menu. */
  protected closeContactsMenu(): void {
    this.contactsMenuOpen.set(false);
  }

  /**
   * Switches the dialog into edit mode and initializes form states.
   * @public
   */
  startEditing(): void {
    if (this.isDeleting() || this.isSaving()) return;

    this.initializeEditForm();
    this.initializeContactSelection();
    this.initializeEditableSubtasks();

    this.newSubtaskTitle.set('');
    this.closeContactsMenu();
    this.errorMessage.set('');
    this.isEditing.set(true);
  }

  /**
   * Cancels editing mode and reverts local state.
   * @public
   */
  cancelEditing(): void {
    if (this.isSaving()) return;

    this.closeContactsMenu();
    this.newSubtaskTitle.set('');
    this.errorMessage.set('');
    this.isEditing.set(false);
  }

  /**
   * Updates the task priority in the reactive form.
   * @param priority - The new priority level.
   * @public
   */
  setPriority(priority: TaskPriority): void {
    this.editForm.controls.priority.setValue(priority);
    this.editForm.controls.priority.markAsDirty();
  }

  /** @public Toggles the visibility of the contact assignment menu. */
  toggleContactsMenu(): void {
    this.contactsMenuOpen.update((isOpen) => !isOpen);
  }

  /** @public Checks if a specific contact is selected. */
  isContactSelected(contactId: string): boolean {
    return this.selectedContactIds().includes(contactId);
  }

  /** @public Toggles the selection state of a contact by ID. */
  toggleContactSelection(contactId: string): void {
    this.selectedContactIds.update((contactIds) => {
      if (contactIds.includes(contactId)) {
        return contactIds.filter((id) => id !== contactId);
      }
      return [...contactIds, contactId];
    });
  }

  /** @public Updates the title of the new subtask being drafted. */
  updateNewSubtaskTitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newSubtaskTitle.set(input.value);
  }

  /** @public Adds a new subtask to the editable list. */
  addSubtask(): void {
    const title = this.newSubtaskTitle().trim();
    if (!title) return;

    this.editableSubtasks.update((subtasks) => [
      ...subtasks,
      { title, isCompleted: false },
    ]);
    this.newSubtaskTitle.set('');
  }

  /** @public Updates the title of an existing editable subtask. */
  updateEditableSubtaskTitle(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editableSubtasks.update((subtasks) =>
      subtasks.map((subtask, currentIndex) => {
        if (currentIndex !== index) return subtask;
        return { ...subtask, title: input.value };
      })
    );
  }

  /** @public Removes a subtask from the editable list. */
  removeEditableSubtask(index: number): void {
    this.editableSubtasks.update((subtasks) =>
      subtasks.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  /** @public Returns true if any subtask has an empty title. */
  hasInvalidSubtask(): boolean {
    return this.editableSubtasks().some((subtask) => subtask.title.trim().length === 0);
  }

  /** @public Saves changes to the task and initiates persistence. */
  async saveTask(): Promise<void> {
    if (this.isSaving()) return;

    this.editForm.markAllAsTouched();
    this.errorMessage.set('');

    if (this.editForm.invalid || this.hasInvalidSubtask()) {
      this.errorMessage.set('Please complete all required fields.');
      return;
    }

    await this.executeTaskUpdate();
  }

  /**
   * Toggles the completion state of a subtask.
   * @param subtask - The subtask to toggle.
   * @param event - The input change event.
   * @public
   */
  async toggleSubtask(subtask: Subtask, event: Event): Promise<void> {
    const checkbox = event.target as HTMLInputElement;
    this.updatingSubtaskId.set(subtask.id);
    this.errorMessage.set('');

    try {
      const updatedSubtask = await this.taskService.toggleSubtaskCompletion(
        subtask.id,
        checkbox.checked
      );
      this.subtaskUpdated.emit(updatedSubtask);
    } catch (error) {
      checkbox.checked = subtask.isCompleted;
      console.error('Subtask could not be updated.', error);
      this.errorMessage.set('Subtask could not be updated.');
    } finally {
      this.updatingSubtaskId.set(null);
    }
  }

  /** @public Deletes the task from the service and closes the dialog. */
  async deleteTask(): Promise<void> {
    if (this.isDeleting() || this.isSaving()) return;

    const taskId = this.task().id;
    this.isDeleting.set(true);
    this.errorMessage.set('');

    try {
      await this.taskService.deleteTask(taskId);
      this.taskDeleted.emit(taskId);
      this.closeDialog();
    } catch (error) {
      console.error('Task could not be deleted.', error);
      this.errorMessage.set('Task could not be deleted.');
      this.isDeleting.set(false);
    }
  }

  /** @public Generates initials for a given contact. */
  getInitials(contact: Contact): string {
    return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
  }

  /** @internal Resets the edit form with current task values. */
  private initializeEditForm(): void {
    const task = this.task();
    this.editForm.reset({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
    });
  }

  /** @internal Synchronizes local selection state with assigned contacts. */
  private initializeContactSelection(): void {
    this.selectedContactIds.set(this.assignedContacts().map((contact) => contact.id));
  }

  /** @internal Populates the local editable subtask state. */
  private initializeEditableSubtasks(): void {
    this.editableSubtasks.set(
      this.subtasks().map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      }))
    );
  }

  /** @internal Orchestrates the task update process. */
  private async executeTaskUpdate(): Promise<void> {
    this.isSaving.set(true);
    try {
      const updatedTask = await this.persistTaskChanges();
      this.emitTaskUpdate(updatedTask);
      this.closeContactsMenu();
      this.isEditing.set(false);
    } catch (error) {
      this.handleTaskUpdateError(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  /** @internal Logs and displays task update errors. */
  private handleTaskUpdateError(error: unknown): void {
    console.error('Task could not be updated.', error);
    this.errorMessage.set('Task could not be updated.');
  }

  /** @internal Calls the service to persist task changes. */
  private async persistTaskChanges(): Promise<Task> {
    const formValue = this.editForm.getRawValue();
    return this.taskService.updateTaskWithRelations(this.task().id, {
      task: {
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        dueDate: formValue.dueDate,
        priority: formValue.priority,
        category: formValue.category,
      },
      subtasks: this.createSubtaskPayload(),
      contactIds: [...this.selectedContactIds()],
    });
  }

  /** @internal Maps local editable subtasks to the update payload format. */
  private createSubtaskPayload(): UpdateTaskSubtaskInput[] {
    return this.editableSubtasks().map((subtask, index) => ({
      ...(subtask.id && { id: subtask.id }),
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
      sortOrder: index,
    }));
  }

  /** @internal Emits the update event with current service state. */
  private emitTaskUpdate(updatedTask: Task): void {
    this.taskUpdated.emit({
      task: updatedTask,
      subtasks: [...this.taskService.selectedSubtasks()],
      assignedContacts: [...this.taskService.assignedContacts()],
    });
  }

  /** @internal Prevents scrolling on the underlying page. */
  private lockPageScroll(): void {
    this.previousBodyOverflow = this.document.body.style.overflow;
    this.previousHtmlOverflow = this.document.documentElement.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.document.documentElement.style.overflow = 'hidden';
  }

  /** @internal Restores previous page scroll state. */
  private restorePageScroll(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
    this.document.documentElement.style.overflow = this.previousHtmlOverflow;
  }

  /** @internal Clears the active dialog close timer. */
  private clearCloseTimer(): void {
    if (this.closeTimerId === undefined) return;
    window.clearTimeout(this.closeTimerId);
  }
}

/**
 * Helper to format date strings from YYYY-MM-DD to DD/MM/YYYY.
 * @internal
 */
function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-');
  if (!year || !month || !day) return dueDate;
  return `${day}/${month}/${year}`;
}