import { SlicePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { Task, TaskPriority } from '../../../../core/models/task.model';
import { BoardCardsDialogStateService } from './board-cards-dialog-state.service';
import {
  BoardCardsDialogWorkflowService,
  BoardDialogUpdateResult,
} from './board-cards-dialog-workflow.service';
import {
  formatDueDate,
  getContactInitials,
  getContactSelectionLabel,
  getInputElement,
} from './board-cards-dialog.utils';

/** Describes the task and relation state emitted after an update. */
export interface TaskDialogUpdate {
  /** Updated task data. */
  task: Task;
  /** Complete persisted subtask state. */
  subtasks: Subtask[];
  /** Complete persisted contact assignment state. */
  assignedContacts: Contact[];
}

/** Displays task details and provides task editing and deletion actions. */
@Component({
  selector: 'app-board-cards-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, SlicePipe],
  providers: [BoardCardsDialogStateService, BoardCardsDialogWorkflowService],
  templateUrl: './board-cards-dialog.html',
  styleUrl: './board-cards-dialog.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeContactsMenu()',
  },
})
export class BoardCardsDialog implements OnInit, OnDestroy {
  private readonly state = inject(BoardCardsDialogStateService);
  private readonly workflow = inject(BoardCardsDialogWorkflowService);

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

  readonly isClosing = this.state.isClosing;
  readonly isDeleting = this.state.isDeleting;
  readonly isEditing = this.state.isEditing;
  readonly isSaving = this.state.isSaving;
  readonly contactsMenuOpen = this.state.contactsMenuOpen;
  readonly updatingSubtaskId = this.state.updatingSubtaskId;
  readonly selectedContactIds = this.state.selectedContactIds;
  readonly editableSubtasks = this.state.editableSubtasks;
  readonly newSubtaskTitle = this.state.newSubtaskTitle;
  readonly isSubtaskFocused = this.state.isSubtaskFocused;
  readonly editingSubtaskIndex = this.state.editingSubtaskIndex;
  readonly editingSubtaskTitle = this.state.editingSubtaskTitle;
  readonly errorMessage = this.state.errorMessage;
  readonly editForm = this.state.editForm;

  /** Human-readable category of the displayed task. */
  readonly categoryLabel = computed(() => {
    return this.task().category === 'technical_task' ? 'Technical Task' : 'User Story';
  });

  /** Capitalized priority of the displayed task. */
  readonly priorityLabel = computed(() => {
    const priority = this.task().priority;
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  });

  /** Due date formatted for display in the task dialog. */
  readonly formattedDueDate = computed(() => formatDueDate(this.task().dueDate));

  /** Contacts resolved from the current selected identifiers. */
  readonly selectedContacts = computed(() => {
    const selectedIds = new Set(this.selectedContactIds());
    return this.availableContacts().filter((contact) => selectedIds.has(contact.id));
  });

  /** Summary shown in the contact assignment control. */
  readonly contactSelectionLabel = computed(() => {
    return getContactSelectionLabel(this.selectedContactIds().length);
  });

  /** Locks scrolling on the page behind the dialog. */
  ngOnInit(): void {
    this.state.initialize();
  }

  /** Clears pending work and restores the previous page scroll state. */
  ngOnDestroy(): void {
    this.state.destroy();
  }

  /** Starts the dialog closing animation. */
  closeDialog(): void {
    this.state.close(() => this.dialogClosed.emit());
  }

  /**
   * Stops dialog clicks from reaching the backdrop and closes an unrelated menu.
   * @param event - Mouse event raised inside the dialog.
   */
  protected handleDialogClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.contactsMenuOpen()) {
      this.closeContactsMenuForTarget(event.target);
    }
  }

  /**
   * Closes the contact menu after a click outside its container.
   * @param event - Document click event to inspect.
   */
  protected onDocumentClick(event: Event): void {
    if (this.contactsMenuOpen()) {
      this.closeContactsMenuForTarget(event.target);
    }
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
    this.state.startEditing(this.task(), this.assignedContacts(), this.subtasks());
  }

  /** Discards local editing state and returns to the detail view. */
  cancelEditing(): void {
    if (!this.isSaving()) {
      this.state.cancelEditing();
    }
  }

  /**
   * Applies a priority to the edit form and marks it as changed.
   * @param priority - Priority selected by the user.
   */
  setPriority(priority: TaskPriority): void {
    this.state.setPriority(priority);
  }

  /** Toggles the contact assignment menu. */
  toggleContactsMenu(): void {
    this.contactsMenuOpen.update((isOpen) => !isOpen);
  }

  /**
   * Checks whether a contact is currently selected.
   * @param contactId - Identifier of the contact to inspect.
   * @returns True when the contact is selected.
   */
  isContactSelected(contactId: string): boolean {
    return this.selectedContactIds().includes(contactId);
  }

  /**
   * Adds or removes a contact from the current selection.
   * @param contactId - Identifier of the contact to toggle.
   */
  toggleContactSelection(contactId: string): void {
    this.state.toggleContactSelection(contactId);
  }

  /**
   * Stores the title entered for a new subtask.
   * @param event - Input event containing the current title.
   */
  updateNewSubtaskTitle(event: Event): void {
    this.newSubtaskTitle.set(getInputElement(event).value);
  }

  /** Adds a non-empty subtask draft to the editable collection. */
  addSubtask(): void {
    this.state.addSubtask();
  }

  /**
   * Initializes inline editing for the subtask at the requested index.
   * @param index - Index of the subtask to edit.
   */
  startEditingSubtask(index: number): void {
    this.state.startEditingSubtask(index);
  }

  /**
   * Stores the title entered during an inline subtask edit.
   * @param event - Input event containing the current title.
   */
  updateEditingSubtaskTitle(event: Event): void {
    this.editingSubtaskTitle.set(getInputElement(event).value);
  }

  /** Applies the inline edited title and exits edit mode. */
  saveSubtaskEdit(): void {
    this.state.saveSubtaskEdit();
  }

  /**
   * Removes an editable subtask by its current index.
   * @param index - Index of the subtask to remove.
   */
  removeEditableSubtask(index: number): void {
    this.state.removeEditableSubtask(index);
  }

  /**
   * Checks whether an editable subtask has an empty title.
   * @returns True when at least one subtask title is invalid.
   */
  hasInvalidSubtask(): boolean {
    return this.state.hasInvalidSubtask();
  }

  /** Validates and persists the complete task edit state. */
  async saveTask(): Promise<void> {
    if (this.isSaving()) {
      return;
    }
    this.editForm.markAllAsTouched();
    this.errorMessage.set('');
    if (this.editForm.invalid || this.hasInvalidSubtask()) {
      this.errorMessage.set('Please complete all required fields.');
      return;
    }
    await this.executeTaskUpdate();
  }

  /**
   * Persists a changed subtask completion state.
   * @param subtask - Subtask whose completion state changed.
   * @param event - Checkbox change event containing the requested state.
   */
  async toggleSubtask(subtask: Subtask, event: Event): Promise<void> {
    const checkbox = getInputElement(event);
    this.updatingSubtaskId.set(subtask.id);
    this.errorMessage.set('');
    try {
      await this.completeSubtaskToggle(subtask.id, checkbox.checked);
    } catch (error) {
      this.handleSubtaskToggleError(subtask, checkbox, error);
    } finally {
      this.updatingSubtaskId.set(null);
    }
  }

  /** Deletes the current task and starts closing the dialog. */
  async deleteTask(): Promise<void> {
    if (this.isDeleting() || this.isSaving()) {
      return;
    }
    const taskId = this.task().id;
    this.isDeleting.set(true);
    this.errorMessage.set('');
    try {
      await this.completeTaskDeletion(taskId);
    } catch (error) {
      this.handleTaskDeletionError(error);
    }
  }

  /**
   * Creates uppercase initials for a contact.
   * @param contact - Contact whose initials should be created.
   * @returns Combined first and last name initials.
   */
  getInitials(contact: Contact): string {
    return getContactInitials(contact);
  }

  /**
   * Persists and emits a changed subtask completion state.
   * @param subtaskId - Identifier of the subtask to update.
   * @param checked - Requested completion state.
   */
  private async completeSubtaskToggle(subtaskId: string, checked: boolean): Promise<void> {
    const updatedSubtask = await this.workflow.toggleSubtask(subtaskId, checked);
    this.subtaskUpdated.emit(updatedSubtask);
  }

  /**
   * Restores the checkbox and exposes a subtask update failure.
   * @param subtask - Original subtask state.
   * @param checkbox - Checkbox whose state must be restored.
   * @param error - Original persistence error.
   */
  private handleSubtaskToggleError(
    subtask: Subtask,
    checkbox: HTMLInputElement,
    error: unknown,
  ): void {
    checkbox.checked = subtask.isCompleted;
    console.error('Subtask could not be updated.', error);
    this.errorMessage.set('Subtask could not be updated.');
  }

  /**
   * Emits deletion state and starts closing after persistence.
   * @param taskId - Identifier of the deleted task.
   */
  private async completeTaskDeletion(taskId: string): Promise<void> {
    await this.workflow.deleteTask(taskId);
    this.taskDeleted.emit(taskId);
    this.closeDialog();
  }

  /**
   * Logs and exposes a task deletion failure.
   * @param error - Original persistence error.
   */
  private handleTaskDeletionError(error: unknown): void {
    console.error('Task could not be deleted.', error);
    this.errorMessage.set('Task could not be deleted.');
    this.isDeleting.set(false);
  }

  /** Persists the edit state and updates the dialog after success. */
  private async executeTaskUpdate(): Promise<void> {
    this.isSaving.set(true);
    try {
      const update = await this.persistTaskChanges();
      this.completeTaskUpdate(update);
    } catch (error) {
      this.handleTaskUpdateError(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Creates and persists the complete task update payload.
   * @returns Updated task and synchronized relation state.
   */
  private persistTaskChanges(): Promise<BoardDialogUpdateResult> {
    return this.workflow.updateTask(
      this.task().id,
      this.editForm.getRawValue(),
      this.editableSubtasks(),
      this.selectedContactIds(),
    );
  }

  /**
   * Emits synchronized task state and leaves edit mode.
   * @param update - Persisted task and relation state.
   */
  private completeTaskUpdate(update: BoardDialogUpdateResult): void {
    this.taskUpdated.emit(update);
    this.closeContactsMenu();
    this.isEditing.set(false);
  }

  /**
   * Logs and exposes a task update failure.
   * @param error - Original persistence error.
   */
  private handleTaskUpdateError(error: unknown): void {
    console.error('Task could not be updated.', error);
    this.errorMessage.set('Task could not be updated.');
  }

  /**
   * Closes the contact menu unless the event target belongs to it.
   * @param target - Event target to inspect.
   */
  private closeContactsMenuForTarget(target: EventTarget | null): void {
    if (!(target instanceof Element)) {
      this.closeContactsMenu();
      return;
    }
    if (!target.closest('.board_dialog__contact_select')) {
      this.closeContactsMenu();
    }
  }
}