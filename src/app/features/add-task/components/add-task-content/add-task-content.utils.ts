import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';
import { CreateTaskWithRelationsInput } from '../../../../core/models/task-persistence.model';
import {
  CreateTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../../../core/models/task.model';

/** Defines the operational mode of the task form. */
export type AddTaskMode = 'page' | 'dialog';

/** Represents a subtask during the creation draft phase. */
export interface DraftSubtask {
  /** Draft title shown in the task form. */
  title: string;
}

/** Describes a selectable task category. */
export interface TaskCategoryOption {
  /** Persisted category value. */
  value: TaskCategory;

  /** Label displayed in the form. */
  label: string;
}

/** Categories available in the task form. */
export const TASK_CATEGORY_OPTIONS: TaskCategoryOption[] = [
  { value: 'technical_task', label: 'Technical Task' },
  { value: 'user_story', label: 'User Story' },
];

const createTitleControl = () =>
  new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)],
  });

const createDescriptionControl = () =>
  new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(1000)],
  });

const createDueDateControl = () =>
  new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, dateNotInPastValidator()],
  });

const createPriorityControl = () =>
  new FormControl<TaskPriority>('medium', {
    nonNullable: true,
    validators: [Validators.required],
  });

const createCategoryControl = () =>
  new FormControl<TaskCategory | ''>('', {
    nonNullable: true,
    validators: [Validators.required],
  });

/**
 * Creates an isolated reactive form for task creation.
 * @returns Fresh task creation form.
 */
export function createAddTaskForm() {
  return new FormGroup({
    title: createTitleControl(),
    description: createDescriptionControl(),
    dueDate: createDueDateControl(),
    priority: createPriorityControl(),
    category: createCategoryControl(),
  });
}

/** Task form type inferred from the form factory. */
export type AddTaskForm = ReturnType<typeof createAddTaskForm>;

/**
 * Checks whether a form control is touched and invalid.
 * @param control - Form control to inspect.
 * @returns Whether a visible validation error is present.
 */
export function hasTouchedError(control: AbstractControl): boolean {
  return control.touched && control.invalid;
}

/**
 * Returns the validation message for a task title.
 * @param control - Title control to inspect.
 * @returns Visible validation message or an empty string.
 */
export function getTitleErrorMessage(control: AbstractControl): string {
  if (!control.touched) return '';
  return control.invalid ? 'This field is required' : '';
}

/**
 * Returns the validation message for a task due date.
 * @param control - Due date control to inspect.
 * @returns Visible validation message or an empty string.
 */
export function getDueDateErrorMessage(control: AbstractControl): string {
  if (!control.touched) return '';
  if (control.hasError('required')) return 'This field is required';
  if (control.hasError('dateInPast')) return 'Due date cannot be in the past';
  return '';
}

/**
 * Returns the validation message for a task category.
 * @param control - Category control to inspect.
 * @returns Visible validation message or an empty string.
 */
export function getCategoryErrorMessage(control: AbstractControl): string {
  if (!control.touched) return '';
  return control.invalid ? 'This field is required' : '';
}

/**
 * Resolves the display label of a selected task category.
 * @param category - Selected category or an empty value.
 * @returns Matching display label or an empty string.
 */
export function getCategoryLabel(category: TaskCategory | ''): string {
  return TASK_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? '';
}

/**
 * Generates uppercase initials for a contact.
 * @param contact - Contact whose initials are requested.
 * @returns Two-character contact initials.
 */
export function getContactInitials(contact: Contact): string {
  return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
}

/**
 * Creates a searchable lowercase value for a contact.
 * @param contact - Contact to transform.
 * @returns Searchable combination of name and email.
 */
export function getContactSearchValue(contact: Contact): string {
  return (`${contact.firstName} ` + `${contact.lastName} ` + contact.email).toLowerCase();
}

/**
 * Formats a date for an HTML date input.
 * @param date - Date to format.
 * @returns Local date in YYYY-MM-DD format.
 */
export function createDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Creates a validator that rejects dates before today.
 * @returns Validator for an HTML date input.
 */
export function dateNotInPastValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const selectedDate = new Date(`${value}T00:00:00`);
    return selectedDate < createStartOfToday() ? { dateInPast: true } : null;
  };
}

/**
 * Maps task form state to the persistence input.
 * @param form - Task form containing the entered values.
 * @param status - Initial workflow status.
 * @param sortOrder - Initial position in the board column.
 * @param subtasks - Draft subtasks to persist.
 * @param contactIds - Selected contact identifiers.
 * @returns Task and relation input for persistence.
 */
export function createTaskInput(
  form: AddTaskForm,
  status: TaskStatus,
  sortOrder: number,
  subtasks: DraftSubtask[],
  contactIds: string[],
): CreateTaskWithRelationsInput {
  return {
    task: createTaskPayload(form.getRawValue(), status, sortOrder),
    subtasks: createSubtaskPayload(subtasks),
    contactIds: [...contactIds],
  };
}

/** Raw value returned by the task form. */
type AddTaskFormValue = ReturnType<AddTaskForm['getRawValue']>;

const createTaskPayload = (
  formValue: AddTaskFormValue,
  status: TaskStatus,
  sortOrder: number,
): CreateTask => ({
  title: formValue.title.trim(),
  description: formValue.description.trim(),
  dueDate: formValue.dueDate,
  priority: formValue.priority,
  category: formValue.category as TaskCategory,
  status,
  sortOrder,
});

const createSubtaskPayload = (subtasks: DraftSubtask[]) =>
  subtasks.map((subtask, index) => ({
    title: subtask.title.trim(),
    sortOrder: index,
  }));

const createStartOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());