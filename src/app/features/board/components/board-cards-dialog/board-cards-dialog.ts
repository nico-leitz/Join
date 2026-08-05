import { DOCUMENT, SlicePipe } from '@angular/common';
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
import { Subtask } from '../../../../core/models/subtask.model';
import { UpdateTaskSubtaskInput } from '../../../../core/models/task-persistence.model';
import {
  Task,
  TaskCategory,
  TaskPriority,
} from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';

/**
 * Describes the task and relation state emitted after an update.
 */
export interface TaskDialogUpdate {
  /** Updated task data. */
  task: Task;

  /** Complete persisted subtask state. */
  subtasks: Subtask[];

  /** Complete persisted contact assignment state. */
  assignedContacts: Contact[];
}

/**
 * Represents a persisted or newly created subtask during editing.
 */
interface EditableSubtask {
  /** Persisted identifier or undefined for a new subtask. */
  id?: string;

  /** Editable subtask title. */
  title: string;

  /** Current completion state. */
  isCompleted: boolean;
}

/**
 * Displays task details and provides task editing and deletion actions.
 *
 * Manages task fields, subtasks, contact assignments, scroll locking
 * and the dialog closing animation.
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
  /** Duration of the dialog closing animation in milliseconds. */
  private readonly closeAnimationMs = 200;

  /** Browser document used to lock the underlying page scroll. */
  private readonly document = inject(DOCUMENT);

  /** Service used for task, subtask and assignment persistence. */
  private readonly taskService = inject(TaskService);

  /** Form builder used to create the non-nullable edit form. */
  private readonly formBuilder = inject(FormBuilder);

  /** Previous inline overflow value of the document body. */
  private previousBodyOverflow = '';

  /** Previous inline overflow value of the document root. */
  private previousHtmlOverflow = '';

  /** Identifier of the pending dialog close timer. */
  private closeTimerId: number | undefined;

  /** Task displayed and edited by the dialog. */
  readonly task = input.required<Task>();

  /** Subtasks belonging to the displayed task. */
  readonly subtasks = input<Subtask[]>([]);

  /** Contacts currently assigned to the displayed task. */
  readonly assignedContacts = input<Contact[]>([]);

  /** Complete contact collection available for assignment. */
  readonly availableContacts = input<Contact[]>([]);

  /** Emits after the closing animation has completed. */
  readonly dialogClosed = output<void>();

  /** Emits after a subtask completion state was persisted. */
  readonly subtaskUpdated = output<Subtask>();

  /** Emits the identifier of a successfully deleted task. */
  readonly taskDeleted = output<string>();

  /** Emits the complete task state after a successful update. */
  readonly taskUpdated = output<TaskDialogUpdate>();

  /** Indicates whether the dialog closing animation is running. */
  readonly isClosing = signal(false);

  /** Indicates whether the task deletion request is running. */
  readonly isDeleting = signal(false);

  /** Indicates whether the dialog displays its edit form. */
  readonly isEditing = signal(false);

  /** Indicates whether task changes are being persisted. */
  readonly isSaving = signal(false);

  /** Indicates whether the contact assignment menu is open. */
  readonly contactsMenuOpen = signal(false);

  /** Identifier of the subtask currently being updated. */
  readonly updatingSubtaskId = signal<string | null>(null);

  /** Identifiers selected in the contact assignment menu. */
  readonly selectedContactIds = signal<string[]>([]);

  /** Local editable copy of the current subtasks. */
  readonly editableSubtasks = signal<EditableSubtask[]>([]);

  /** Current title of the new subtask draft. */
  readonly newSubtaskTitle = signal('');

  /** Indicates whether the subtask creator input is focused. */
  readonly isSubtaskFocused = signal(false);

  /** Index of the subtask currently being edited inline. */
  readonly editingSubtaskIndex = signal<number | null>(null);

  /** Temporary title of the subtask currently being edited inline. */
  readonly editingSubtaskTitle = signal('');

  /** User-facing message for the latest dialog operation failure. */
  readonly errorMessage = signal('');

  /** Reactive form containing the editable task fields. */
  readonly editForm = this.formBuilder.nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120),
      ],
    ],
    description: ['', Validators.maxLength(1000)],
    dueDate: ['', Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    category: ['user_story' as TaskCategory, Validators.required],
  });

  /** Human-readable category of the displayed task. */
  readonly categoryLabel = computed(() => {
    return this.task().category === 'technical_task'
      ? 'Technical Task'
      : 'User Story';
  });

  /** Capitalized priority of the displayed task. */
  readonly priorityLabel = computed(() => {
    const priority = this.task().priority;

    return priority.charAt(0).toUpperCase() + priority.slice(1);
  });

  /** Due date formatted for display in the task dialog. */
  readonly formattedDueDate = computed(() => {
    return formatDueDate(this.task().dueDate);
  });

  /** Contacts resolved from the current selected identifiers. */
  readonly selectedContacts = computed(() => {
    const selectedIds = new Set(this.selectedContactIds());

    return this.availableContacts().filter((contact) => {
      return selectedIds.has(contact.id);
    });
  });

  /** Summary shown in the contact assignment control. */
  readonly contactSelectionLabel = computed(() => {
    const selectedAmount = this.selectedContactIds().length;

    if (selectedAmount === 0) {
      return 'Select contacts to assign';
    }

    if (selectedAmount === 1) {
      return '1 contact selected';
    }

    return `${selectedAmount} contacts selected`;
  });

  /** Locks scrolling on the page behind the dialog. */
  ngOnInit(): void {
    this.lockPageScroll();
  }

  /** Clears pending work and restores the previous page scroll state. */
  ngOnDestroy(): void {
    this.clearCloseTimer();
    this.restorePageScroll();
  }

  /** Starts the dialog closing animation. */
  closeDialog(): void {
    if (this.isClosing() || this.isSaving()) {
      return;
    }

    this.isClosing.set(true);

    this.closeTimerId = window.setTimeout(() => {
      this.dialogClosed.emit();
    }, this.closeAnimationMs);
  }

  /**
   * Stops dialog clicks from reaching the backdrop and closes an unrelated menu.
   *
   * @param event - Mouse event raised inside the dialog.
   */
  protected handleDialogClick(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.contactsMenuOpen()) {
      return;
    }

    this.closeContactsMenuForTarget(event.target);
  }

  /**
   * Closes the contact menu after a click outside its container.
   *
   * @param event - Document click event to inspect.
   */
  protected onDocumentClick(event: Event): void {
    if (!this.contactsMenuOpen()) {
      return;
    }

    this.closeContactsMenuForTarget(event.target);
  }

  /** Closes the contact assignment menu. */
  protected closeContactsMenu(): void {
    this.contactsMenuOpen.set(false);
  }

  /** Initializes editable state and switches the dialog to edit mode. */
  startEditing(): void {
    if (this.isDeleting() || this.isSaving()) {
      return;
    }

    this.initializeEditForm();
    this.initializeContactSelection();
    this.initializeEditableSubtasks();
    this.resetSubtaskEditState();
    this.closeContactsMenu();
    this.errorMessage.set('');
    this.isEditing.set(true);
  }

  /** Discards local editing state and returns to the detail view. */
  cancelEditing(): void {
    if (this.isSaving()) {
      return;
    }

    this.closeContactsMenu();
    this.resetSubtaskEditState();
    this.errorMessage.set('');
    this.isEditing.set(false);
  }

  /**
   * Applies a priority to the edit form and marks it as changed.
   *
   * @param priority - Priority selected by the user.
   */
  setPriority(priority: TaskPriority): void {
    const priorityControl = this.editForm.controls.priority;

    priorityControl.setValue(priority);
    priorityControl.markAsDirty();
  }

  /** Toggles the contact assignment menu. */
  toggleContactsMenu(): void {
    this.contactsMenuOpen.update((isOpen) => !isOpen);
  }

  /**
   * Checks whether a contact is currently selected.
   *
   * @param contactId - Identifier of the contact to inspect.
   * @returns True when the contact is selected.
   */
  isContactSelected(contactId: string): boolean {
    return this.selectedContactIds().includes(contactId);
  }

  /**
   * Adds or removes a contact from the current selection.
   *
   * @param contactId - Identifier of the contact to toggle.
   */
  toggleContactSelection(contactId: string): void {
    this.selectedContactIds.update((contactIds) => {
      if (contactIds.includes(contactId)) {
        return contactIds.filter((id) => id !== contactId);
      }

      return [...contactIds, contactId];
    });
  }

  /**
   * Stores the title entered for a new subtask.
   *
   * @param event - Input event containing the current title.
   */
  updateNewSubtaskTitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newSubtaskTitle.set(input.value);
  }

  /** Adds a non-empty subtask draft to the editable collection. */
  addSubtask(): void {
    const title = this.newSubtaskTitle().trim();

    if (!title) {
      return;
    }

    this.editableSubtasks.update((subtasks) => [
      ...subtasks,
      {
        title,
        isCompleted: false,
      },
    ]);

    this.newSubtaskTitle.set('');
  }

  /**
   * Initializes the inline editing mode for a specific subtask.
   *
   * @param index - Index of the subtask to edit.
   */
  startEditingSubtask(index: number): void {
    const subtask = this.editableSubtasks()[index];

    if (!subtask) {
      return;
    }

    this.editingSubtaskTitle.set(subtask.title);
    this.editingSubtaskIndex.set(index);
  }

  /**
   * Stores the title entered during an inline subtask edit.
   *
   * @param event - Input event containing the current title.
   */
  updateEditingSubtaskTitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingSubtaskTitle.set(input.value);
  }

  /** Applies the inline edited title and exits edit mode. */
  saveSubtaskEdit(): void {
    const index = this.editingSubtaskIndex();
    const title = this.editingSubtaskTitle().trim();

    if (index === null || !title) {
      return;
    }

    this.editableSubtasks.update((subtasks) => {
      return subtasks.map((subtask, currentIndex) => {
        return currentIndex === index
          ? { ...subtask, title }
          : subtask;
      });
    });

    this.clearInlineSubtaskEdit();
  }

  /**
   * Removes an editable subtask by its current index.
   *
   * @param index - Index of the subtask to remove.
   */
  removeEditableSubtask(index: number): void {
    this.editableSubtasks.update((subtasks) => {
      return subtasks.filter((_, currentIndex) => {
        return currentIndex !== index;
      });
    });

    const editingIndex = this.editingSubtaskIndex();

    if (editingIndex === index) {
      this.clearInlineSubtaskEdit();
      return;
    }

    if (editingIndex !== null && editingIndex > index) {
      this.editingSubtaskIndex.set(editingIndex - 1);
    }
  }

  /**
   * Checks whether an editable subtask has an empty title.
   *
   * @returns True when at least one subtask title is invalid.
   */
  hasInvalidSubtask(): boolean {
    return this.editableSubtasks().some((subtask) => {
      return subtask.title.trim().length === 0;
    });
  }

  /**
   * Validates and persists the complete task edit state.
   *
   * @returns A promise that resolves after the save attempt.
   */
  async saveTask(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.editForm.markAllAsTouched();
    this.errorMessage.set('');

    if (this.editForm.invalid || this.hasInvalidSubtask()) {
      this.errorMessage.set(
        'Please complete all required fields.',
      );

      return;
    }

    await this.executeTaskUpdate();
  }

  /**
   * Persists a changed subtask completion state.
   *
   * @param subtask - Subtask whose completion state changed.
   * @param event - Checkbox change event containing the requested state.
   * @returns A promise that resolves after the update attempt.
   */
  async toggleSubtask(
    subtask: Subtask,
    event: Event,
  ): Promise<void> {
    const checkbox = event.target as HTMLInputElement;

    this.updatingSubtaskId.set(subtask.id);
    this.errorMessage.set('');

    try {
      const updatedSubtask =
        await this.taskService.toggleSubtaskCompletion(
          subtask.id,
          checkbox.checked,
        );

      this.subtaskUpdated.emit(updatedSubtask);
    } catch (error) {
      checkbox.checked = subtask.isCompleted;

      console.error(
        'Subtask could not be updated.',
        error,
      );

      this.errorMessage.set(
        'Subtask could not be updated.',
      );
    } finally {
      this.updatingSubtaskId.set(null);
    }
  }

  /**
   * Deletes the current task and starts closing the dialog.
   *
   * @returns A promise that resolves after the deletion attempt.
   */
  async deleteTask(): Promise<void> {
    if (this.isDeleting() || this.isSaving()) {
      return;
    }

    const taskId = this.task().id;

    this.isDeleting.set(true);
    this.errorMessage.set('');

    try {
      await this.taskService.deleteTask(taskId);

      this.taskDeleted.emit(taskId);
      this.closeDialog();
    } catch (error) {
      console.error(
        'Task could not be deleted.',
        error,
      );

      this.errorMessage.set(
        'Task could not be deleted.',
      );

      this.isDeleting.set(false);
    }
  }

  /**
   * Creates uppercase initials for a contact.
   *
   * @param contact - Contact whose initials should be created.
   * @returns Combined first and last name initials.
   */
  getInitials(contact: Contact): string {
    return (
      contact.firstName.charAt(0) +
      contact.lastName.charAt(0)
    ).toUpperCase();
  }

  /** Resets all local subtask creator and editing values. */
  private resetSubtaskEditState(): void {
    this.newSubtaskTitle.set('');
    this.isSubtaskFocused.set(false);
    this.clearInlineSubtaskEdit();
  }

  /** Exits the inline subtask editing mode. */
  private clearInlineSubtaskEdit(): void {
    this.editingSubtaskIndex.set(null);
    this.editingSubtaskTitle.set('');
  }

  /**
   * Closes the contact menu unless the event target belongs to it.
   *
   * @param target - Event target to inspect.
   */
  private closeContactsMenuForTarget(
    target: EventTarget | null,
  ): void {
    if (!(target instanceof Element)) {
      this.closeContactsMenu();
      return;
    }

    const contactSelect = target.closest(
      '.board_dialog__contact_select',
    );

    if (!contactSelect) {
      this.closeContactsMenu();
    }
  }

  /** Resets the edit form with the current task values. */
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

  /** Synchronizes selected identifiers with the assigned contacts. */
  private initializeContactSelection(): void {
    this.selectedContactIds.set(
      this.assignedContacts().map((contact) => {
        return contact.id;
      }),
    );
  }

  /** Creates editable copies of the current subtasks. */
  private initializeEditableSubtasks(): void {
    this.editableSubtasks.set(
      this.subtasks().map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      })),
    );
  }

  /**
   * Persists the edit state and updates the dialog after success.
   *
   * @returns A promise that resolves after the update attempt.
   */
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

  /**
   * Logs and exposes a task update error.
   *
   * @param error - Original persistence error.
   */
  private handleTaskUpdateError(error: unknown): void {
    console.error(
      'Task could not be updated.',
      error,
    );

    this.errorMessage.set(
      'Task could not be updated.',
    );
  }

  /**
   * Creates and persists the complete task update payload.
   *
   * @returns Updated application task.
   * @throws The persistence error returned by the task service.
   */
  private async persistTaskChanges(): Promise<Task> {
    const formValue = this.editForm.getRawValue();

    return this.taskService.updateTaskWithRelations(
      this.task().id,
      {
        task: {
          title: formValue.title.trim(),
          description: formValue.description.trim(),
          dueDate: formValue.dueDate,
          priority: formValue.priority,
          category: formValue.category,
        },
        subtasks: this.createSubtaskPayload(),
        contactIds: [...this.selectedContactIds()],
      },
    );
  }

  /**
   * Maps editable subtasks to the persistence input format.
   *
   * @returns Complete ordered subtask update state.
   */
  private createSubtaskPayload(): UpdateTaskSubtaskInput[] {
    return this.editableSubtasks().map((subtask, index) => ({
      ...(subtask.id && {
        id: subtask.id,
      }),
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
      sortOrder: index,
    }));
  }

  /**
   * Emits the updated task together with the synchronized relation state.
   *
   * @param updatedTask - Persisted task returned by the task service.
   */
  private emitTaskUpdate(updatedTask: Task): void {
    this.taskUpdated.emit({
      task: updatedTask,
      subtasks: [...this.taskService.selectedSubtasks()],
      assignedContacts: [
        ...this.taskService.assignedContacts(),
      ],
    });
  }

  /** Stores the current overflow values and locks page scrolling. */
  private lockPageScroll(): void {
    this.previousBodyOverflow =
      this.document.body.style.overflow;

    this.previousHtmlOverflow =
      this.document.documentElement.style.overflow;

    this.document.body.style.overflow = 'hidden';
    this.document.documentElement.style.overflow = 'hidden';
  }

  /** Restores the page overflow values captured during initialization. */
  private restorePageScroll(): void {
    this.document.body.style.overflow =
      this.previousBodyOverflow;

    this.document.documentElement.style.overflow =
      this.previousHtmlOverflow;
  }

  /** Cancels and clears the pending dialog close timer. */
  private clearCloseTimer(): void {
    if (this.closeTimerId === undefined) {
      return;
    }

    window.clearTimeout(this.closeTimerId);
    this.closeTimerId = undefined;
  }
}

/**
 * Formats an ISO-style date for display without timezone conversion.
 *
 * @param dueDate - Date value expected in YYYY-MM-DD format.
 * @returns Date formatted as DD/MM/YYYY or the original invalid value.
 */
function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-');

  if (!year || !month || !day) {
    return dueDate;
  }

  return `${day}/${month}/${year}`;
}