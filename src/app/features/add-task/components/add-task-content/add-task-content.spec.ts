import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskCategory, TaskPriority } from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';
import {
  ContactServiceMock,
  MOCK_CONTACTS,
  TaskServiceMock,
  createContactServiceMock,
  createExpectedInput,
  createTaskServiceMock,
} from './add-task-content-test.utils';
import { AddTaskContent, dateNotInPastValidator } from './add-task-content';

let component: AddTaskContent;
let fixture: ComponentFixture<AddTaskContent>;
let mockTaskService: TaskServiceMock;
let mockContactService: ContactServiceMock;

/** Configures the component testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [AddTaskContent],
    providers: [
      { provide: TaskService, useValue: mockTaskService },
      { provide: ContactService, useValue: mockContactService },
    ],
  }).compileComponents();
}

/** Creates a fresh component fixture and its service mocks. */
async function setupComponent(): Promise<void> {
  mockTaskService = createTaskServiceMock();
  mockContactService = createContactServiceMock();
  await configureTestBed();
  fixture = TestBed.createComponent(AddTaskContent);
  component = fixture.componentInstance;
  vi.spyOn(component.cancelled, 'emit');
  vi.spyOn(component.taskCreated, 'emit');
  vi.useFakeTimers();
  fixture.detectChanges();
}

/** Restores real timers after each component test. */
function restoreTimers(): void {
  vi.useRealTimers();
}

/**
 * Creates a date input value relative to the current day.
 * @param daysFromToday - Number of days to add to the current date.
 * @returns Date formatted for the task form.
 */
function createFutureDateInputValue(daysFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
}

/**
 * Creates today's local date input value.
 * @returns Current date formatted for the validator.
 */
function createTodayInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Updates the component mode input.
 * @param mode - Page or dialog mode to activate.
 */
function setMode(mode: 'page' | 'dialog'): void {
  fixture.componentRef.setInput('mode', mode);
  fixture.detectChanges();
}

/**
 * Adds a draft subtask through the component API.
 * @param title - Title assigned to the draft subtask.
 */
function addDraftSubtask(title: string): void {
  component.newSubtaskTitle.set(title);
  component.addSubtask();
}

/**
 * Edits an existing draft subtask through the component API.
 * @param index - Index of the subtask to edit.
 * @param title - Replacement subtask title.
 */
function editDraftSubtask(index: number, title: string): void {
  component.startEditingSubtask(index);
  component.editingSubtaskTitle.set(title);
  component.saveSubtaskEdit();
}

/**
 * Queries an element inside the component fixture.
 * @param selector - CSS selector used for the lookup.
 * @returns Matching element or null.
 */
function queryElement<T extends Element>(selector: string): T | null {
  return fixture.nativeElement.querySelector(selector) as T | null;
}

/**
 * Populates every task field used by the submission test.
 * @param dueDate - Due date assigned to the form.
 */
function setCompleteTaskForm(dueDate: string): void {
  component.taskForm.patchValue({
    title: 'Integration Test Task',
    description: 'Test description',
    dueDate,
    priority: 'low',
    category: 'user_story',
  });
}

/**
 * Populates the required task form fields.
 * @param dueDate - Due date assigned to the form.
 * @param priority - Priority assigned to the form.
 * @param category - Category assigned to the form.
 */
function setRequiredTaskForm(
  dueDate: string,
  priority: TaskPriority,
  category: TaskCategory,
): void {
  component.taskForm.patchValue({ title: 'Valid Task', dueDate, priority, category });
}

/** Verifies initial data loading and task cache reuse. */
async function shouldLoadInitialData(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  expect(component).toBeTruthy();
  expect(mockContactService.getContacts).toHaveBeenCalled();
  expect(mockTaskService.getTasks).not.toHaveBeenCalled();
  expect(component.allContacts()).toEqual(MOCK_CONTACTS);
}

/** Verifies required-field validation messages. */
function shouldShowRequiredFieldErrors(): void {
  component.taskForm.controls.title.markAsTouched();
  component.taskForm.controls.dueDate.markAsTouched();
  expect(component.hasTitleError()).toBe(true);
  expect(component.getTitleErrorMessage()).toBe('This field is required');
  expect(component.hasDueDateError()).toBe(true);
  expect(component.getDueDateErrorMessage()).toBe('This field is required');
}

/** Verifies rejection of past due dates. */
function shouldInvalidatePastDueDates(): void {
  component.taskForm.controls.dueDate.setValue('2000-01-01');
  component.taskForm.controls.dueDate.markAsTouched();
  expect(component.hasDueDateError()).toBe(true);
  expect(component.getDueDateErrorMessage()).toBe('Due date cannot be in the past');
}

/** Verifies task priority selection. */
function shouldUpdatePriority(): void {
  component.setPriority('urgent');
  expect(component.taskForm.controls.priority.value).toBe('urgent');
  expect(component.taskForm.controls.priority.dirty).toBe(true);
}

/** Verifies contact selection and deselection. */
function shouldToggleContactSelection(): void {
  component.toggleContactSelection('c1');
  expect(component.isContactSelected('c1')).toBe(true);
  expect(component.selectedContactIds()).toContain('c1');
  expect(component.selectedContacts()).toHaveLength(1);
  expect(component.selectedContacts()[0].firstName).toBe('John');
  component.toggleContactSelection('c1');
  expect(component.isContactSelected('c1')).toBe(false);
  expect(component.selectedContactIds()).not.toContain('c1');
}

/** Verifies draft subtask creation, editing, and removal. */
function shouldManageSubtasks(): void {
  addDraftSubtask('Draft Subtask');
  expect(component.draftSubtasks()).toEqual([{ title: 'Draft Subtask' }]);
  expect(component.newSubtaskTitle()).toBe('');
  editDraftSubtask(0, 'Edited Subtask');
  expect(component.draftSubtasks()[0].title).toBe('Edited Subtask');
  expect(component.editingSubtaskIndex()).toBeNull();
  component.removeSubtask(0);
  expect(component.draftSubtasks()).toHaveLength(0);
}

/** Verifies opening the inline subtask editor from the template. */
function shouldOpenSubtaskEditor(): void {
  component.draftSubtasks.set([{ title: 'Clickable Subtask' }]);
  fixture.detectChanges();
  const titleButton = queryElement<HTMLButtonElement>('.add-task__subtask-title');
  expect(titleButton).not.toBeNull();
  titleButton!.click();
  fixture.detectChanges();
  expect(component.editingSubtaskIndex()).toBe(0);
  expect(component.editingSubtaskTitle()).toBe('Clickable Subtask');
  expect(queryElement('.add-task__subtask-edit-input')).not.toBeNull();
}

/** Verifies category selection and menu closure. */
function shouldSelectCategory(): void {
  component.toggleCategoryMenu();
  expect(component.categoryMenuOpen()).toBe(true);
  component.selectCategory('technical_task');
  expect(component.taskForm.controls.category.value).toBe('technical_task');
  expect(component.getCategoryLabel()).toBe('Technical Task');
  expect(component.categoryMenuOpen()).toBe(false);
}

/** Verifies task submission, payload mapping, and success state. */
async function shouldSubmitTask(): Promise<void> {
  const dueDate = createFutureDateInputValue(5);
  setCompleteTaskForm(dueDate);
  component.toggleContactSelection('c2');
  addDraftSubtask('Subtask 1');
  await component.submitTask();
  expect(mockTaskService.createTaskWithRelations).toHaveBeenCalledWith(
    createExpectedInput(dueDate),
  );
  expect(component.taskCreated.emit).toHaveBeenCalled();
  expect(component.successMessage()).toBe('Task successfully created');
}

/** Verifies automatic removal of the task success message. */
async function shouldHideSuccessMessage(): Promise<void> {
  const dueDate = createFutureDateInputValue(1);
  setRequiredTaskForm(dueDate, 'medium', 'technical_task');
  await component.submitTask();
  expect(component.successMessage()).toBe('Task successfully created');
  vi.advanceTimersByTime(2200);
  expect(component.successMessage()).toBe('');
}

/** Verifies cancellation through the dialog secondary action. */
function shouldCancelDialog(): void {
  setMode('dialog');
  component.handleSecondaryAction();
  expect(component.cancelled.emit).toHaveBeenCalled();
}

/** Prepares modified task state for the page reset test. */
function preparePageDraft(): void {
  component.taskForm.patchValue({ title: 'Draft title' });
  component.toggleContactSelection('c1');
  addDraftSubtask('Draft subtask');
}

/** Verifies complete form reset through the page secondary action. */
function shouldClearPageForm(): void {
  setMode('page');
  preparePageDraft();
  component.handleSecondaryAction();
  expect(component.taskForm.controls.title.value).toBe('');
  expect(component.selectedContactIds()).toHaveLength(0);
  expect(component.draftSubtasks()).toHaveLength(0);
}

/** Verifies document clicks close every open selection menu. */
function shouldCloseMenus(): void {
  component.toggleContactsMenu();
  component.toggleCategoryMenu();
  document.dispatchEvent(new MouseEvent('click'));
  expect(component.contactsMenuOpen()).toBe(false);
  expect(component.categoryMenuOpen()).toBe(false);
}

/** Verifies the date validator accepts the current day. */
function shouldAcceptToday(): void {
  const validator = dateNotInPastValidator();
  const control = new FormControl(createTodayInputValue());
  expect(validator(control)).toBeNull();
}

/** Verifies the date validator rejects a past day. */
function shouldRejectPastDate(): void {
  const validator = dateNotInPastValidator();
  const control = new FormControl('1999-12-31');
  expect(validator(control)).toEqual({ dateInPast: true });
}

/** Registers component form and validation tests. */
function registerFormTests(): void {
  it('should create the component and load initial data', shouldLoadInitialData);
  it('should show validation errors for invalid title and due date', shouldShowRequiredFieldErrors);
  it('should invalidate past due dates', shouldInvalidatePastDueDates);
  it('should update priority when setPriority is called', shouldUpdatePriority);
  it('should select a category and close the category menu', shouldSelectCategory);
}

/** Registers component interaction tests. */
function registerInteractionTests(): void {
  it('should toggle contact selection and update selected contacts', shouldToggleContactSelection);
  it('should manage subtask creation, editing, and deletion', shouldManageSubtasks);
  it('should start editing when the subtask title is clicked', shouldOpenSubtaskEditor);
  it('should emit cancelled event on secondary action when in dialog mode', shouldCancelDialog);
  it('should clear the form on secondary action when in page mode', shouldClearPageForm);
  it('should close menus on document click', shouldCloseMenus);
}

/** Registers component submission tests. */
function registerSubmissionTests(): void {
  it('should successfully submit the form and emit creation event', shouldSubmitTask);
  it('should hide the success message after 2200ms', shouldHideSuccessMessage);
}

describe('AddTaskContent Component', () => {
  beforeEach(setupComponent);
  afterEach(restoreTimers);
  registerFormTests();
  registerInteractionTests();
  registerSubmissionTests();
});

describe('dateNotInPastValidator', () => {
  it("should return null for today's date", shouldAcceptToday);
  it('should return error object for past dates', shouldRejectPastDate);
});