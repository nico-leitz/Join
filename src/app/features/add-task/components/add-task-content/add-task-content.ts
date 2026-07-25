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
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';
import { CreateTaskWithRelationsInput } from '../../../../core/models/task-persistence.model';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';
import { SlicePipe } from '@angular/common';


/** Defines the operational mode of the component. */
type AddTaskMode = 'page' | 'dialog';

/** Represents a subtask during the creation draft phase. */
interface DraftSubtask {
  title: string;
}

/**
 * Component for the task creation form.
 *
 * @remarks
 * This component handles the form logic for creating new tasks, including
 * managing subtask drafts, contact assignment, and category/priority selection.
 * It supports both page-based and dialog-based layouts.
 *
 * @public
 */
@Component({
  selector: 'app-add-task-content',
  imports: [ReactiveFormsModule, SlicePipe],
  templateUrl: './add-task-content.html',
  styleUrl: './add-task-content.scss',
  host: {
    '(document:click)': 'handleDocumentClick()',
    '(document:keydown.escape)': 'closeMenus()',
  },
})
export class AddTaskContent implements OnInit, OnDestroy {
  /** @internal Service for handling task operations. */
  private readonly taskService = inject(TaskService);

  /** @internal Service for retrieving contact data. */
  private readonly contactService = inject(ContactService);

  /** @internal Timer ID for the success message display. */
  private successTimerId: number | undefined;

  /** The operational mode of the component. */
  readonly mode = input<AddTaskMode>('page');

  /** The initial status assigned to the new task. */
  readonly status = input<TaskStatus>('todo');

  /** Event emitted when the user cancels the operation. */
  readonly cancelled = output<void>();

  /** Event emitted when a task is successfully created. */
  readonly taskCreated = output<Task>();

  /** List of all available contacts. */
  readonly allContacts = this.contactService.allContacts;

  /** Signal indicating if data is currently being loaded. */
  readonly isLoadingData = signal(false);

  /** Signal indicating if the form is currently being submitted. */
  readonly isSubmitting = signal(false);

  /** Signal tracking visibility of the contact selection menu. */
  readonly contactsMenuOpen = signal(false);

  /** Signal tracking visibility of the category selection menu. */
  readonly categoryMenuOpen = signal(false);

  /** Signal tracking IDs of currently selected contacts. */
  readonly selectedContactIds = signal<string[]>([]);

  /** Signal for the contact search input value. */
  readonly contactSearch = signal('');

  /** Signal for the list of subtasks being drafted. */
  readonly draftSubtasks = signal<DraftSubtask[]>([]);

  /** Signal for the title of the subtask being added. */
  readonly newSubtaskTitle = signal('');

  /** Signal tracking index of the subtask being edited. */
  readonly editingSubtaskIndex = signal<number | null>(null);

  /** Signal for the title of the subtask being edited. */
  readonly editingSubtaskTitle = signal('');

  /** Signal for displaying error messages. */
  readonly errorMessage = signal('');

  /** Signal for displaying success messages. */
  readonly successMessage = signal('');

  /** Computed minimum allowed date for the due date input. */
  readonly minimumDueDate = createDateInputValue(new Date());

  /** Tracks focus state of subtask input. */
  isSubtaskFocused = signal(false);

  /** @public Sets focus state to true. */
  onInputFocus() {
    this.isSubtaskFocused.set(true);
  }

  /** @public Sets focus state to false. */
  onInputBlur() {
    this.isSubtaskFocused.set(false);
  }

  /**
   * Clears the new subtask title and blurs the input.
   * @param inputElement - The HTML input element to clear.
   */
  clearInput(inputElement: HTMLInputElement) {
    this.newSubtaskTitle.set('');
    inputElement.blur();
  }

  /** Configuration for available task categories. */
  readonly categoryOptions: {
    value: TaskCategory;
    label: string;
  }[] = [
    { value: 'technical_task', label: 'Technical Task' },
    { value: 'user_story', label: 'User Story' },
  ];

  /** Reactive form group for task creation. */
  readonly taskForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    dueDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, dateNotInPastValidator()],
    }),
    priority: new FormControl<TaskPriority>('medium', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category: new FormControl<TaskCategory | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /** Computed list of contacts filtered by the search term. */
  readonly filteredContacts = computed(() => {
    const searchValue = this.contactSearch().trim().toLowerCase();
    if (!searchValue) return this.allContacts();
    return this.allContacts().filter((contact) =>
      getContactSearchValue(contact).includes(searchValue),
    );
  });

  /** Computed list of full contact objects based on selected IDs. */
  readonly selectedContacts = computed(() => {
    const selectedIds = new Set(this.selectedContactIds());
    return this.allContacts().filter((contact) => selectedIds.has(contact.id));
  });

  /** Computed placeholder text for the contact selector. */
  readonly contactPlaceholder = computed(() => {
    const selectedAmount = this.selectedContactIds().length;
    if (selectedAmount === 0) return 'Select contacts to assign';
    if (selectedAmount === 1) return '1 contact selected';
    return `${selectedAmount} contacts selected`;
  });

  /** @public Lifecycle hook: Loads initial data. */
  async ngOnInit(): Promise<void> {
    await this.loadInitialData();
  }

  /** @public Lifecycle hook: Cleans up resources. */
  ngOnDestroy(): void {
    this.clearSuccessTimer();
  }

  /** @protected Handles clicks within the component to manage menu state. */
  protected handleContentClick(event: MouseEvent): void {
    event.stopPropagation();
    const target = event.target;
    if (!(target instanceof Element)) {
      this.closeMenus();
      return;
    }
    this.closeUnrelatedMenus(target);
  }

  /** @protected Handles document-wide clicks to close menus. */
  protected handleDocumentClick(): void {
    this.closeMenus();
  }

  /** @protected Closes all open interaction menus. */
  protected closeMenus(): void {
    this.contactsMenuOpen.set(false);
    this.categoryMenuOpen.set(false);
  }

  /** Updates the task priority. */
  setPriority(priority: TaskPriority): void {
    this.taskForm.controls.priority.setValue(priority);
    this.taskForm.controls.priority.markAsDirty();
  }

  /** Toggles the contact selection menu. */
  toggleContactsMenu(): void {
    this.categoryMenuOpen.set(false);
    this.contactsMenuOpen.update((isOpen) => !isOpen);
  }

  /** Opens the contact selection menu. */
  openContactsMenu(): void {
    this.categoryMenuOpen.set(false);
    this.contactsMenuOpen.set(true);
  }

  /** Updates search term and opens the contact menu. */
  updateContactSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.contactSearch.set(input.value);
    this.openContactsMenu();
  }

  /** Checks if a contact is currently selected. */
  isContactSelected(contactId: string): boolean {
    return this.selectedContactIds().includes(contactId);
  }

  /** Toggles selection state of a specific contact. */
  toggleContactSelection(contactId: string): void {
    this.selectedContactIds.update((contactIds) => {
      if (contactIds.includes(contactId)) {
        return contactIds.filter((id) => id !== contactId);
      }
      return [...contactIds, contactId];
    });
  }

  /** Toggles the category selection menu. */
  toggleCategoryMenu(): void {
    this.contactsMenuOpen.set(false);
    this.categoryMenuOpen.update((isOpen) => !isOpen);
    this.taskForm.controls.category.markAsTouched();
  }

  /** Selects a category and closes the menu. */
  selectCategory(category: TaskCategory): void {
    this.taskForm.controls.category.setValue(category);
    this.taskForm.controls.category.markAsDirty();
    this.categoryMenuOpen.set(false);
  }

  /** Returns the label for the currently selected category. */
  getCategoryLabel(): string {
    const category = this.taskForm.controls.category.value;
    return this.categoryOptions.find((option) => option.value === category)?.label ?? '';
  }

  /** Updates the title signal for a new subtask. */
  updateNewSubtaskTitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newSubtaskTitle.set(input.value);
  }

  /** Adds a new subtask to the draft list. */
  addSubtask(): void {
    const title = this.newSubtaskTitle().trim();
    if (!title) return;
    this.draftSubtasks.update((subtasks) => [...subtasks, { title }]);
    this.newSubtaskTitle.set('');
  }

  /** Initiates editing for a subtask at a specific index. */
  startEditingSubtask(index: number): void {
    const subtask = this.draftSubtasks()[index];
    if (!subtask) return;
    this.editingSubtaskIndex.set(index);
    this.editingSubtaskTitle.set(subtask.title);
  }

  /** Updates the temporary title for an editing subtask. */
  updateEditingSubtaskTitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingSubtaskTitle.set(input.value);
  }

  /** Saves the edited subtask. */
  saveSubtaskEdit(): void {
    const index = this.editingSubtaskIndex();
    const title = this.editingSubtaskTitle().trim();
    if (index === null || !title) return;
    this.replaceSubtaskTitle(index, title);
    this.cancelSubtaskEdit();
  }

  /** Cancels the subtask editing state. */
  cancelSubtaskEdit(): void {
    this.editingSubtaskIndex.set(null);
    this.editingSubtaskTitle.set('');
  }

  /** Removes a subtask from the list. */
  removeSubtask(index: number): void {
    this.draftSubtasks.update((subtasks) =>
      subtasks.filter((_, currentIndex) => currentIndex !== index),
    );
    this.cancelSubtaskEdit();
  }

  /** Generates initials for a contact. */
  getInitials(contact: Contact): string {
    return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
  }

  /** Checks if the title control has validation errors. */
  hasTitleError(): boolean {
    return hasTouchedError(this.taskForm.controls.title);
  }

  /** Checks if the due date control has validation errors. */
  hasDueDateError(): boolean {
    return hasTouchedError(this.taskForm.controls.dueDate);
  }

  /** Checks if the category control has validation errors. */
  hasCategoryError(): boolean {
    return hasTouchedError(this.taskForm.controls.category);
  }

  /** Gets the error message for the title control. */
  getTitleErrorMessage(): string {
    const control = this.taskForm.controls.title;
    if (!control.touched) return '';
    return control.invalid ? 'This field is required' : '';
  }

  /** Gets the error message for the due date control. */
  getDueDateErrorMessage(): string {
    const control = this.taskForm.controls.dueDate;
    if (!control.touched) return '';
    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('dateInPast')) return 'Due date cannot be in the past';
    return '';
  }

  /** Gets the error message for the category control. */
  getCategoryErrorMessage(): string {
    const control = this.taskForm.controls.category;
    if (!control.touched) return '';
    return control.invalid ? 'This field is required' : '';
  }

  /** Handles secondary action (cancel or reset). */
  handleSecondaryAction(): void {
    if (this.isSubmitting()) return;
    if (this.mode() === 'dialog') {
      this.cancelled.emit();
      return;
    }
    this.resetForm();
  }

  /** Submits the task creation form. */
  async submitTask(): Promise<void> {
    if (this.isSubmitting()) return;
    this.taskForm.markAllAsTouched();
    this.errorMessage.set('');

    if (this.taskForm.invalid) {
      this.errorMessage.set('Please complete all required fields.');
      return;
    }
    await this.executeTaskCreation();
  }

  /** @internal Loads initial application data. */
  private async loadInitialData(): Promise<void> {
    this.isLoadingData.set(true);
    try {
      await Promise.all([this.loadContacts(), this.loadTasks()]);
    } catch {
      this.errorMessage.set('Form data could not be loaded completely.');
    } finally {
      this.isLoadingData.set(false);
    }
  }

  /** @internal Loads contacts if not already loaded. */
  private async loadContacts(): Promise<void> {
    if (this.allContacts().length > 0) return;
    const contacts = await this.contactService.getContacts();
    this.allContacts.set(contacts);
  }

  /** @internal Loads tasks if not already loaded. */
  private async loadTasks(): Promise<void> {
    if (this.taskService.allTasks().length > 0) return;
    await this.taskService.getTasks();
  }

  /** @internal Closes menus that are not related to the clicked target. */
  private closeUnrelatedMenus(target: Element): void {
    if (!target.closest('.add-task__contact-select')) this.contactsMenuOpen.set(false);
    if (!target.closest('.add-task__category-select')) this.categoryMenuOpen.set(false);
  }

  /** @internal Updates a subtask's title in the draft list. */
  private replaceSubtaskTitle(index: number, title: string): void {
    this.draftSubtasks.update((subtasks) =>
      subtasks.map((subtask, currentIndex) => (currentIndex === index ? { title } : subtask)),
    );
  }

  /** @internal Executes the task creation process. */
  private async executeTaskCreation(): Promise<void> {
    this.isSubmitting.set(true);
    try {
      const task = await this.taskService.createTaskWithRelations(this.createTaskInput());
      this.handleCreationSuccess(task);
    } catch {
      this.errorMessage.set('Task could not be created.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /** @internal Formats the form data into the API payload structure. */
  private createTaskInput(): CreateTaskWithRelationsInput {
    const formValue = this.taskForm.getRawValue();
    return {
      task: {
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        dueDate: formValue.dueDate,
        priority: formValue.priority,
        category: formValue.category as TaskCategory,
        status: this.status(),
        sortOrder: this.getNextSortOrder(),
      },
      subtasks: this.createSubtaskPayload(),
      contactIds: [...this.selectedContactIds()],
    };
  }

  /** @internal Creates the subtask payload for the API. */
  private createSubtaskPayload() {
    return this.draftSubtasks().map((subtask, index) => ({
      title: subtask.title.trim(),
      sortOrder: index,
    }));
  }

  /** @internal Calculates the sort order for the new task. */
  private getNextSortOrder(): number {
    const statusTasks = this.taskService.allTasks().filter((task) => task.status === this.status());
    return statusTasks.length;
  }

  /** @internal Handles successful task creation. */
  private handleCreationSuccess(task: Task): void {
    this.resetForm();
    this.showSuccessMessage('Task successfully created');
    this.taskCreated.emit(task);
  }

  /** @internal Displays a temporary success message. */
  private showSuccessMessage(message: string): void {
    this.clearSuccessTimer();
    this.successMessage.set(message);
    this.successTimerId = window.setTimeout(() => {
      this.successMessage.set('');
    }, 2200);
  }

  /** @internal Resets the form to initial state. */
  private resetForm(): void {
    this.taskForm.reset({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      category: '',
    });
    this.resetAdditionalFields();
  }

  /** @internal Resets non-form state fields. */
  private resetAdditionalFields(): void {
    this.selectedContactIds.set([]);
    this.contactSearch.set('');
    this.draftSubtasks.set([]);
    this.newSubtaskTitle.set('');
    this.cancelSubtaskEdit();
    this.closeMenus();
    this.errorMessage.set('');
  }

  /** @internal Clears the success message timer. */
  private clearSuccessTimer(): void {
    if (this.successTimerId === undefined) return;
    window.clearTimeout(this.successTimerId);
  }
}

/**
 * Helper: Checks if a form control is touched and invalid.
 * @internal
 */
function hasTouchedError(control: AbstractControl): boolean {
  return control.touched && control.invalid;
}

/**
 * Helper: Combines contact fields into a searchable string.
 * @internal
 */
function getContactSearchValue(contact: Contact): string {
  return (`${contact.firstName} ` + `${contact.lastName} ` + contact.email).toLowerCase();
}

/**
 * Helper: Formats a Date object to a YYYY-MM-DD string.
 * @internal
 */
function createDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validator: Ensures the selected date is not in the past.
 * @public
 */
export function dateNotInPastValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const selectedDate = new Date(`${value}T00:00:00`);
    const today = createStartOfToday();
    return selectedDate < today ? { dateInPast: true } : null;
  };
}

/**
 * Helper: Creates a Date object representing the start of today.
 * @internal
 */
function createStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}





