import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Task } from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { BoardCardsDialog } from './board-cards-dialog';
import {
  EXPECTED_DIALOG_UPDATE,
  EXPECTED_UPDATE_INPUT,
  MOCK_CONTACTS,
  MOCK_SUBTASKS,
  MOCK_TASK,
  UPDATED_TASK,
  BoardTaskServiceMock,
  createBoardTaskServiceMock,
} from './board-card-test.utils';

/** Protected dialog methods exercised through DOM-facing tests. */
interface BoardCardsDialogTestAccess {
  /** Handles a click inside the dialog. */
  handleDialogClick(event: MouseEvent): void;

  /** Handles a document-level click. */
  onDocumentClick(event: Event): void;
}

let component: BoardCardsDialog;
let fixture: ComponentFixture<BoardCardsDialog>;
let mockDocument: Document;
let mockTaskService: BoardTaskServiceMock;

/** Configures the standalone dialog with its task service mock. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [BoardCardsDialog],
    providers: [{ provide: TaskService, useValue: mockTaskService }],
  }).compileComponents();
}

/** Applies the standard task and relation inputs to the fixture. */
function setComponentInputs(): void {
  fixture.componentRef.setInput('task', MOCK_TASK);
  fixture.componentRef.setInput('subtasks', MOCK_SUBTASKS);
  fixture.componentRef.setInput('availableContacts', MOCK_CONTACTS);
  fixture.componentRef.setInput('assignedContacts', [MOCK_CONTACTS[0]]);
}

/** Spies on every output used by the dialog tests. */
function spyOnOutputs(): void {
  vi.spyOn(component.dialogClosed, 'emit');
  vi.spyOn(component.subtaskUpdated, 'emit');
  vi.spyOn(component.taskDeleted, 'emit');
  vi.spyOn(component.taskUpdated, 'emit');
}

/** Creates a fresh dialog fixture and resets document scroll styles. */
async function setupComponent(): Promise<void> {
  mockTaskService = createBoardTaskServiceMock();
  await configureTestBed();
  mockDocument = TestBed.inject(DOCUMENT);
  mockDocument.body.style.overflow = '';
  mockDocument.documentElement.style.overflow = '';
  fixture = TestBed.createComponent(BoardCardsDialog);
  component = fixture.componentInstance;
  setComponentInputs();
  spyOnOutputs();
  vi.useFakeTimers();
  fixture.detectChanges();
}

/** Restores timers and mocks after each dialog test. */
function cleanUpComponent(): void {
  vi.useRealTimers();
  vi.clearAllMocks();
}

/**
 * Replaces the current task input and refreshes computed values.
 * @param taskPatch - Task fields to override.
 */
function updateTaskInput(taskPatch: Partial<Task>): void {
  fixture.componentRef.setInput('task', { ...MOCK_TASK, ...taskPatch });
  fixture.detectChanges();
}

/**
 * Creates an input event containing the requested value.
 * @param value - Input value exposed through the event target.
 * @returns Event backed by an HTML input element.
 */
function createInputEvent(value: string): Event {
  const input = document.createElement('input');
  input.value = value;
  return { target: input } as unknown as Event;
}

/**
 * Creates a checkbox event and exposes its target for assertions.
 * @param checked - Initial checkbox state.
 * @returns Checkbox element and matching input event.
 */
function createCheckboxEvent(checked: boolean): { event: Event; input: HTMLInputElement } {
  const input = document.createElement('input');
  input.checked = checked;
  return { input, event: { target: input } as unknown as Event };
}

/** Adds a local subtask draft and verifies its initial state. */
function addEditableSubtask(): void {
  component.newSubtaskTitle.set('New Draft Subtask');
  component.addSubtask();
  expect(component.editableSubtasks()).toHaveLength(2);
  expect(component.editableSubtasks()[1].title).toBe('New Draft Subtask');
  expect(component.newSubtaskTitle()).toBe('');
}

/** Edits the newly added subtask and verifies its title. */
function editEditableSubtask(): void {
  component.startEditingSubtask(1);
  component.updateEditingSubtaskTitle(createInputEvent('Updated Draft'));
  component.saveSubtaskEdit();
  expect(component.editableSubtasks()[1].title).toBe('Updated Draft');
}

/** Makes the first editable subtask invalid. */
function invalidateFirstSubtask(): void {
  component.editableSubtasks.update((subtasks) => {
    return subtasks.map((subtask, index) => {
      return index === 0 ? { ...subtask, title: '   ' } : subtask;
    });
  });
}

/** Verifies component creation and page scroll locking. */
function shouldCreateAndLockPageScroll(): void {
  expect(component).toBeTruthy();
  expect(mockDocument.body.style.overflow).toBe('hidden');
  expect(mockDocument.documentElement.style.overflow).toBe('hidden');
}

/** Verifies restoration of both page scroll styles. */
function shouldRestorePageScroll(): void {
  component.ngOnDestroy();
  expect(mockDocument.body.style.overflow).toBe('');
  expect(mockDocument.documentElement.style.overflow).toBe('');
}

/** Verifies the formatted task due date. */
function shouldFormatDueDate(): void {
  expect(component.formattedDueDate()).toBe('30/07/2026');
}

/** Verifies category labels for both task categories. */
function shouldComputeCategoryLabel(): void {
  expect(component.categoryLabel()).toBe('Technical Task');
  updateTaskInput({ category: 'user_story' });
  expect(component.categoryLabel()).toBe('User Story');
}

/** Verifies capitalization of task priority labels. */
function shouldComputePriorityLabel(): void {
  expect(component.priorityLabel()).toBe('Urgent');
  updateTaskInput({ priority: 'medium' });
  expect(component.priorityLabel()).toBe('Medium');
}

/** Verifies assignment labels for zero, one and multiple contacts. */
function shouldComputeContactSelectionLabel(): void {
  component.startEditing();
  expect(component.contactSelectionLabel()).toBe('1 contact selected');
  component.toggleContactSelection('c-1');
  expect(component.contactSelectionLabel()).toBe('Select contacts to assign');
  component.toggleContactSelection('c-1');
  component.toggleContactSelection('c-2');
  expect(component.contactSelectionLabel()).toBe('2 contacts selected');
}

/** Verifies delayed dialog closing output. */
function shouldCloseDialogAfterAnimation(): void {
  component.closeDialog();
  expect(component.isClosing()).toBe(true);
  vi.advanceTimersByTime(200);
  expect(component.dialogClosed.emit).toHaveBeenCalled();
}

/** Verifies form and relation initialization in edit mode. */
function shouldPopulateEditMode(): void {
  component.startEditing();
  expect(component.isEditing()).toBe(true);
  expect(component.editForm.controls.title.value).toBe('Review PRs');
  expect(component.editForm.controls.dueDate.value).toBe('2026-07-30');
  expect(component.selectedContactIds()).toContain('c-1');
  expect(component.editableSubtasks()).toHaveLength(1);
  expect(component.editableSubtasks()[0].title).toBe('Backend PR');
}

/** Verifies local state cleanup when editing is cancelled. */
function shouldCancelEditing(): void {
  component.startEditing();
  component.newSubtaskTitle.set('Unsaved draft');
  component.errorMessage.set('Some error');
  component.cancelEditing();
  expect(component.isEditing()).toBe(false);
  expect(component.contactsMenuOpen()).toBe(false);
  expect(component.newSubtaskTitle()).toBe('');
  expect(component.errorMessage()).toBe('');
}

/** Verifies priority changes and dirty state tracking. */
function shouldSetPriority(): void {
  component.startEditing();
  component.setPriority('low');
  expect(component.editForm.controls.priority.value).toBe('low');
  expect(component.editForm.controls.priority.dirty).toBe(true);
}

/** Verifies the complete editable-subtask lifecycle. */
function shouldManageEditableSubtasks(): void {
  component.startEditing();
  addEditableSubtask();
  editEditableSubtask();
  component.removeEditableSubtask(1);
  expect(component.editableSubtasks()).toHaveLength(1);
}

/** Verifies inline editing through the rendered subtask title. */
function shouldEditSubtaskFromTitle(): void {
  component.startEditing();
  fixture.detectChanges();
  const button = fixture.nativeElement.querySelector(
    '.board_dialog__subtask_text',
  ) as HTMLButtonElement;
  button.click();
  fixture.detectChanges();
  expect(component.editingSubtaskIndex()).toBe(0);
  expect(component.editingSubtaskTitle()).toBe('Backend PR');
  expect(fixture.nativeElement.querySelector('.board_dialog__subtask_list_input')).toBeTruthy();
}

/** Verifies adding and removing selected contacts. */
function shouldToggleContactSelection(): void {
  component.startEditing();
  expect(component.isContactSelected('c-1')).toBe(true);
  expect(component.isContactSelected('c-2')).toBe(false);
  component.toggleContactSelection('c-2');
  expect(component.isContactSelected('c-2')).toBe(true);
  expect(component.selectedContactIds()).toContain('c-2');
  component.toggleContactSelection('c-1');
  expect(component.isContactSelected('c-1')).toBe(false);
  expect(component.selectedContactIds()).not.toContain('c-1');
}

/** Verifies menu closing after an unrelated dialog click. */
function shouldCloseContactsMenuFromDialogClick(): void {
  component.contactsMenuOpen.set(true);
  const event = {
    stopPropagation: vi.fn(),
    target: document.createElement('div'),
  } as unknown as MouseEvent;
  (component as unknown as BoardCardsDialogTestAccess).handleDialogClick(event);
  expect(event.stopPropagation).toHaveBeenCalled();
  expect(component.contactsMenuOpen()).toBe(false);
}

/** Verifies menu closing after an outside document click. */
function shouldCloseContactsMenuFromDocumentClick(): void {
  component.contactsMenuOpen.set(true);
  const event = { target: document.body } as unknown as Event;
  (component as unknown as BoardCardsDialogTestAccess).onDocumentClick(event);
  expect(component.contactsMenuOpen()).toBe(false);
}

/** Verifies successful subtask completion persistence. */
async function shouldToggleSubtaskCompletion(): Promise<void> {
  const updatedSubtask = { ...MOCK_SUBTASKS[0], isCompleted: true };
  mockTaskService.toggleSubtaskCompletion.mockResolvedValue(updatedSubtask);
  const { event } = createCheckboxEvent(true);
  await component.toggleSubtask(MOCK_SUBTASKS[0], event);
  expect(mockTaskService.toggleSubtaskCompletion).toHaveBeenCalledWith('sub-1', true);
  expect(component.subtaskUpdated.emit).toHaveBeenCalledWith(updatedSubtask);
  expect(component.errorMessage()).toBe('');
}

/** Verifies checkbox rollback after failed subtask persistence. */
async function shouldHandleSubtaskToggleFailure(): Promise<void> {
  mockTaskService.toggleSubtaskCompletion.mockRejectedValue(new Error('Network Error'));
  const { event, input } = createCheckboxEvent(true);
  await component.toggleSubtask(MOCK_SUBTASKS[0], event);
  expect(mockTaskService.toggleSubtaskCompletion).toHaveBeenCalled();
  expect(input.checked).toBe(false);
  expect(component.errorMessage()).toBe('Subtask could not be updated.');
}

/** Verifies successful task deletion and dialog closing. */
async function shouldDeleteTask(): Promise<void> {
  mockTaskService.deleteTask.mockResolvedValue(undefined);
  await component.deleteTask();
  expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task-1');
  expect(component.taskDeleted.emit).toHaveBeenCalledWith('task-1');
  expect(component.isClosing()).toBe(true);
}

/** Verifies rejection of an invalid task edit form. */
async function shouldRejectInvalidForm(): Promise<void> {
  component.startEditing();
  component.editForm.controls.title.setValue('');
  await component.saveTask();
  expect(mockTaskService.updateTaskWithRelations).not.toHaveBeenCalled();
  expect(component.errorMessage()).toBe('Please complete all required fields.');
}

/** Verifies rejection of an empty editable subtask title. */
async function shouldRejectInvalidSubtask(): Promise<void> {
  component.startEditing();
  invalidateFirstSubtask();
  expect(component.hasInvalidSubtask()).toBe(true);
  await component.saveTask();
  expect(mockTaskService.updateTaskWithRelations).not.toHaveBeenCalled();
  expect(component.errorMessage()).toBe('Please complete all required fields.');
}

/** Verifies payload mapping and output after a successful task update. */
function expectSuccessfulTaskUpdate(): void {
  expect(mockTaskService.updateTaskWithRelations).toHaveBeenCalledWith(
    'task-1',
    EXPECTED_UPDATE_INPUT,
  );
  expect(component.taskUpdated.emit).toHaveBeenCalledWith(EXPECTED_DIALOG_UPDATE);
  expect(component.isEditing()).toBe(false);
}

/** Verifies successful task and relation persistence. */
async function shouldSaveTaskUpdate(): Promise<void> {
  mockTaskService.updateTaskWithRelations.mockResolvedValue(UPDATED_TASK);
  component.startEditing();
  component.editForm.patchValue({ title: 'Updated Title ', description: ' New Desc ' });
  await component.saveTask();
  expectSuccessfulTaskUpdate();
}

/** Verifies state and error output after failed task persistence. */
async function shouldHandleTaskUpdateFailure(): Promise<void> {
  mockTaskService.updateTaskWithRelations.mockRejectedValue(new Error('Internal Server Error'));
  component.startEditing();
  await component.saveTask();
  expect(mockTaskService.updateTaskWithRelations).toHaveBeenCalled();
  expect(component.taskUpdated.emit).not.toHaveBeenCalled();
  expect(component.errorMessage()).toBe('Task could not be updated.');
  expect(component.isEditing()).toBe(true);
}

/** Registers display and local interaction tests. */
// prettier-ignore
function registerInteractionTests(): void {
  it('should create the component and lock page scroll on init', shouldCreateAndLockPageScroll);
  it('should restore page scroll when destroyed', shouldRestorePageScroll);
  it('should correctly format the due date for display', shouldFormatDueDate);
  it('should correctly compute the categoryLabel based on task category', shouldComputeCategoryLabel);
  it('should correctly compute and capitalize the priorityLabel', shouldComputePriorityLabel);
  it('should compute the correct contactSelectionLabel based on selected contacts count', shouldComputeContactSelectionLabel);
  it('should trigger closing animation and emit dialogClosed after 200ms', shouldCloseDialogAfterAnimation);
  it('should switch to edit mode and populate form fields', shouldPopulateEditMode);
  it('should revert state and hide form when cancelEditing is called', shouldCancelEditing);
  it('should update the priority form control when setPriority is called', shouldSetPriority);
  it('should allow adding, updating, and removing editable subtasks', shouldManageEditableSubtasks);
}

/** Registers DOM interaction and persistence tests. */
// prettier-ignore
function registerPersistenceTests(): void {
  it('should start editing when the subtask title is clicked', shouldEditSubtaskFromTitle);
  it('should toggle contact selection correctly', shouldToggleContactSelection);
  it('should close the contacts menu if handleDialogClick is called outside the select area', shouldCloseContactsMenuFromDialogClick);
  it('should close the contacts menu if onDocumentClick is triggered outside the dialog', shouldCloseContactsMenuFromDocumentClick);
  it('should toggle subtask completion via service and emit updated subtask', shouldToggleSubtaskCompletion);
  it('should handle subtask toggle failure by reverting checkbox and showing error', shouldHandleSubtaskToggleFailure);
  it('should delete task, emit taskDeleted, and close dialog on success', shouldDeleteTask);
  it('should reject saving if edit form is invalid', shouldRejectInvalidForm);
  it('should reject saving if an editable subtask has an empty title', shouldRejectInvalidSubtask);
  it('should format payload, save changes via service, and emit taskUpdated event', shouldSaveTaskUpdate);
  it('should gracefully handle API errors during saveTask', shouldHandleTaskUpdateFailure);
}

/** Registers the complete board task dialog test suite. */
function registerBoardCardsDialogTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerInteractionTests();
  registerPersistenceTests();
}

describe('BoardCardsDialog Component', registerBoardCardsDialogTests);