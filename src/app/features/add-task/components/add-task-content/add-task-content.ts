import { SlicePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { AddTaskContentState } from './add-task-content-state.service';
import { AddTaskContentWorkflow } from './add-task-content-workflow.service';
import {
  AddTaskMode,
  TASK_CATEGORY_OPTIONS,
  createAddTaskForm,
  createDateInputValue,
  getCategoryErrorMessage,
  getCategoryLabel,
  getContactInitials,
  getDueDateErrorMessage,
  getTitleErrorMessage,
  hasTouchedError,
} from './add-task-content.utils';

export { dateNotInPastValidator } from './add-task-content.utils';

/** Provides the task creation form for page and dialog layouts. */
@Component({
  selector: 'app-add-task-content',
  imports: [ReactiveFormsModule, SlicePipe],
  providers: [AddTaskContentState, AddTaskContentWorkflow],
  templateUrl: './add-task-content.html',
  styleUrl: './add-task-content.scss',
  host: {
    '(document:click)': 'handleDocumentClick()',
    '(document:keydown.escape)': 'closeMenus()',
  },
})
export class AddTaskContent implements OnInit, OnDestroy {
  private readonly contentState = inject(AddTaskContentState);
  private readonly taskWorkflow = inject(AddTaskContentWorkflow);

  /** Operational layout mode. */
  readonly mode = input<AddTaskMode>('page');

  /** Initial workflow status of the created task. */
  readonly status = input<TaskStatus>('todo');

  /** Emitted when dialog creation is cancelled. */
  readonly cancelled = output<void>();

  /** Emitted after a task was created. */
  readonly taskCreated = output<Task>();

  /** Contacts available for assignment. */
  readonly allContacts = this.contentState.allContacts;

  /** Whether initial form data is loading. */
  readonly isLoadingData = this.taskWorkflow.isLoadingData;

  /** Whether task creation is running. */
  readonly isSubmitting = this.taskWorkflow.isSubmitting;

  /** Whether the contact menu is open. */
  readonly contactsMenuOpen = this.contentState.contactsMenuOpen;

  /** Whether the category menu is open. */
  readonly categoryMenuOpen = this.contentState.categoryMenuOpen;

  /** Identifiers of selected contacts. */
  readonly selectedContactIds = this.contentState.selectedContactIds;

  /** Current contact search term. */
  readonly contactSearch = this.contentState.contactSearch;

  /** Drafted subtasks. */
  readonly draftSubtasks = this.contentState.draftSubtasks;

  /** Title entered for a new subtask. */
  readonly newSubtaskTitle = this.contentState.newSubtaskTitle;

  /** Index of the subtask being edited. */
  readonly editingSubtaskIndex = this.contentState.editingSubtaskIndex;

  /** Temporary edited subtask title. */
  readonly editingSubtaskTitle = this.contentState.editingSubtaskTitle;

  /** Form-level error message. */
  readonly errorMessage = this.taskWorkflow.errorMessage;

  /** Temporary success message. */
  readonly successMessage = this.taskWorkflow.successMessage;

  /** Earliest selectable due date. */
  readonly minimumDueDate = createDateInputValue(new Date());

  /** Whether the new subtask input is focused. */
  isSubtaskFocused = this.contentState.isSubtaskFocused;

  /** Categories available for selection. */
  readonly categoryOptions = TASK_CATEGORY_OPTIONS;

  /** Reactive task creation form. */
  readonly taskForm = createAddTaskForm();

  /** Contacts matching the search term. */
  readonly filteredContacts = this.contentState.filteredContacts;

  /** Full contacts matching the selected identifiers. */
  readonly selectedContacts = this.contentState.selectedContacts;

  /** Placeholder describing the current contact selection. */
  readonly contactPlaceholder = this.contentState.contactPlaceholder;

  /** Loads initial form data. */
  async ngOnInit(): Promise<void> {
    await this.taskWorkflow.loadInitialData();
  }

  /** Clears the success timer. */
  ngOnDestroy(): void {
    this.taskWorkflow.destroy();
  }

  /** Marks the subtask input as focused. */
  onInputFocus(): void {
    this.contentState.focusSubtaskInput();
  }

  /** Marks the subtask input as blurred. */
  onInputBlur(): void {
    this.contentState.blurSubtaskInput();
  }

  /**
   * Clears and blurs the new subtask input.
   * @param inputElement - Input element to clear.
   */
  clearInput(inputElement: HTMLInputElement): void {
    this.contentState.clearSubtaskInput(inputElement);
  }

  /**
   * Handles clicks inside the task form.
   * @param event - Click event originating inside the component.
   */
  protected handleContentClick(event: MouseEvent): void {
    this.contentState.handleContentClick(event);
  }

  /** Closes menus after a document click. */
  protected handleDocumentClick(): void {
    this.closeMenus();
  }

  /** Closes every selection menu. */
  protected closeMenus(): void {
    this.contentState.closeMenus();
  }

  /**
   * Selects a task priority.
   * @param priority - Priority to select.
   */
  setPriority(priority: TaskPriority): void {
    this.taskForm.controls.priority.setValue(priority);
    this.taskForm.controls.priority.markAsDirty();
  }

  /** Toggles the contact selection menu. */
  toggleContactsMenu(): void {
    this.contentState.toggleContactsMenu();
  }

  /** Opens the contact selection menu. */
  openContactsMenu(): void {
    this.contentState.openContactsMenu();
  }

  /**
   * Updates the contact search term.
   * @param event - Input event containing the search value.
   */
  updateContactSearch(event: Event): void {
    this.contentState.updateContactSearch(event);
  }

  /**
   * Checks whether a contact is selected.
   * @param contactId - Contact identifier to inspect.
   * @returns Whether the contact is selected.
   */
  isContactSelected(contactId: string): boolean {
    return this.contentState.isContactSelected(contactId);
  }

  /**
   * Toggles one contact selection.
   * @param contactId - Contact identifier to toggle.
   */
  toggleContactSelection(contactId: string): void {
    this.contentState.toggleContactSelection(contactId);
  }

  /** Toggles the category selection menu. */
  toggleCategoryMenu(): void {
    this.contentState.toggleCategoryMenu();
    this.taskForm.controls.category.markAsTouched();
  }

  /**
   * Selects a task category.
   * @param category - Category to select.
   */
  selectCategory(category: TaskCategory): void {
    this.taskForm.controls.category.setValue(category);
    this.taskForm.controls.category.markAsDirty();
    this.contentState.closeCategoryMenu();
  }

  /**
   * Returns the selected category label.
   * @returns Selected label or an empty string.
   */
  getCategoryLabel(): string {
    return getCategoryLabel(this.taskForm.controls.category.value);
  }

  /**
   * Updates the title for a new subtask.
   * @param event - Input event containing the new title.
   */
  updateNewSubtaskTitle(event: Event): void {
    this.contentState.updateNewSubtaskTitle(event);
  }

  /** Adds a non-empty subtask to the draft. */
  addSubtask(): void {
    this.contentState.addSubtask();
  }

  /**
   * Starts editing one draft subtask.
   * @param index - Index of the subtask to edit.
   */
  startEditingSubtask(index: number): void {
    this.contentState.startEditingSubtask(index);
  }

  /**
   * Updates the temporary subtask edit title.
   * @param event - Input event containing the edited title.
   */
  updateEditingSubtaskTitle(event: Event): void {
    this.contentState.updateEditingSubtaskTitle(event);
  }

  /** Saves a valid subtask title edit. */
  saveSubtaskEdit(): void {
    this.contentState.saveSubtaskEdit();
  }

  /** Cancels subtask editing. */
  cancelSubtaskEdit(): void {
    this.contentState.cancelSubtaskEdit();
  }

  /**
   * Removes one draft subtask.
   * @param index - Index of the subtask to remove.
   */
  removeSubtask(index: number): void {
    this.contentState.removeSubtask(index);
  }

  /**
   * Generates initials for a contact.
   * @param contact - Contact whose initials are requested.
   * @returns Two-character contact initials.
   */
  getInitials(contact: Contact): string {
    return getContactInitials(contact);
  }

  /**
   * Checks whether the title has a visible error.
   * @returns Whether a title error is visible.
   */
  hasTitleError(): boolean {
    return hasTouchedError(this.taskForm.controls.title);
  }

  /**
   * Checks whether the due date has a visible error.
   * @returns Whether a due date error is visible.
   */
  hasDueDateError(): boolean {
    return hasTouchedError(this.taskForm.controls.dueDate);
  }

  /**
   * Checks whether the category has a visible error.
   * @returns Whether a category error is visible.
   */
  hasCategoryError(): boolean {
    return hasTouchedError(this.taskForm.controls.category);
  }

  /**
   * Returns the title validation message.
   * @returns Visible validation message or an empty string.
   */
  getTitleErrorMessage(): string {
    return getTitleErrorMessage(this.taskForm.controls.title);
  }

  /**
   * Returns the due date validation message.
   * @returns Visible validation message or an empty string.
   */
  getDueDateErrorMessage(): string {
    return getDueDateErrorMessage(this.taskForm.controls.dueDate);
  }

  /**
   * Returns the category validation message.
   * @returns Visible validation message or an empty string.
   */
  getCategoryErrorMessage(): string {
    return getCategoryErrorMessage(this.taskForm.controls.category);
  }

  /** Handles cancellation in a dialog or resets a page form. */
  handleSecondaryAction(): void {
    if (this.isSubmitting()) return;
    if (this.mode() === 'dialog') {
      this.cancelled.emit();
      return;
    }
    this.taskWorkflow.resetForm(this.taskForm);
  }

  /** Validates and submits the task creation form. */
  async submitTask(): Promise<void> {
    await this.taskWorkflow.submitTask(this.taskForm, this.status(), (task) => {
      this.taskCreated.emit(task);
    });
  }
}