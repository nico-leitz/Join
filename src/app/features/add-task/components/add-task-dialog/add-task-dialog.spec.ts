import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Task } from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';
import {
  ContactServiceMock,
  TaskServiceMock,
  createContactServiceMock,
  createTaskServiceMock,
} from '../add-task-content/add-task-content-test.utils';
import { AddTaskContent } from '../add-task-content/add-task-content';
import { AddTaskDialog } from './add-task-dialog';

/** Test-accessible surface of the dialog component. */
interface DialogTestAccess {
  addTaskContent?: Pick<AddTaskContent, 'isSubmitting'>;

  /** Closes the dialog when its current state permits it. */
  closeDialog(): void;

  /** Prevents a dialog click from reaching the overlay. */
  handleDialogClick(event: MouseEvent): void;

  /** Starts the successful task creation sequence. */
  handleTaskCreated(task: Task): void;
}

let component: AddTaskDialog;
let fixture: ComponentFixture<AddTaskDialog>;
let mockDocument: Document;
let mockTaskService: TaskServiceMock;
let mockContactService: ContactServiceMock;

/** Configures the component testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [AddTaskDialog],
    providers: [
      { provide: TaskService, useValue: mockTaskService },
      { provide: ContactService, useValue: mockContactService },
    ],
  }).compileComponents();
}

/** Clears the document scroll styles used by the dialog tests. */
function clearScrollStyles(): void {
  mockDocument.body.style.overflow = '';
  mockDocument.documentElement.style.overflow = '';
}

/** Creates a fresh dialog fixture and its service mocks. */
async function setupComponent(): Promise<void> {
  mockTaskService = createTaskServiceMock();
  mockContactService = createContactServiceMock();
  await configureTestBed();
  mockDocument = TestBed.inject(DOCUMENT);
  clearScrollStyles();
  fixture = TestBed.createComponent(AddTaskDialog);
  component = fixture.componentInstance;
  vi.spyOn(component.dialogClosed, 'emit');
  vi.spyOn(component.taskCreated, 'emit');
  vi.useFakeTimers();
  fixture.detectChanges();
}

/** Restores timers and document styles after each dialog test. */
function cleanUpComponent(): void {
  vi.useRealTimers();
  clearScrollStyles();
}

/**
 * Exposes protected dialog methods for direct unit testing.
 * @returns Test-accessible dialog surface.
 */
function getDialogAccess(): DialogTestAccess {
  return component as unknown as DialogTestAccess;
}

/** Verifies component creation and initial page scroll locking. */
function shouldCreateAndLockPageScroll(): void {
  expect(component).toBeTruthy();
  expect(mockDocument.body.style.overflow).toBe('hidden');
  expect(mockDocument.documentElement.style.overflow).toBe('hidden');
}

/** Verifies restoration of page scrolling during component destruction. */
function shouldRestorePageScroll(): void {
  component.ngOnDestroy();
  expect(mockDocument.body.style.overflow).toBe('');
  expect(mockDocument.documentElement.style.overflow).toBe('');
}

/** Verifies that dialog clicks do not propagate to the overlay. */
function shouldStopDialogClickPropagation(): void {
  const mockEvent = new MouseEvent('click');
  vi.spyOn(mockEvent, 'stopPropagation');
  getDialogAccess().handleDialogClick(mockEvent);
  expect(mockEvent.stopPropagation).toHaveBeenCalled();
}

/** Verifies the close animation and delayed close event. */
function shouldCloseWithAnimation(): void {
  getDialogAccess().closeDialog();
  expect(component.isClosing()).toBe(true);
  vi.advanceTimersByTime(200);
  expect(component.dialogClosed.emit).toHaveBeenCalled();
}

/** Verifies that an active child submission prevents dialog closure. */
function shouldNotCloseDuringSubmission(): void {
  getDialogAccess().addTaskContent = { isSubmitting: signal(true) };
  getDialogAccess().closeDialog();
  expect(component.isClosing()).toBe(false);
}

/** Verifies the delayed success state, close animation, and task event. */
function shouldHandleSuccessfulCreation(): void {
  const mockTask = { id: 'task-123', title: 'New Task' } as Task;
  getDialogAccess().handleTaskCreated(mockTask);
  expect(component.hasCreatedTask()).toBe(true);
  expect(component.isClosing()).toBe(false);
  vi.advanceTimersByTime(800);
  expect(component.isClosing()).toBe(true);
  expect(component.taskCreated.emit).not.toHaveBeenCalled();
  vi.advanceTimersByTime(200);
  expect(component.taskCreated.emit).toHaveBeenCalledWith(mockTask);
  expect(component.dialogClosed.emit).not.toHaveBeenCalled();
}

/** Verifies that only the first task creation event is processed. */
function shouldIgnoreSubsequentCreationEvents(): void {
  const firstTask = { id: 'task-1' } as Task;
  const secondTask = { id: 'task-2' } as Task;
  getDialogAccess().handleTaskCreated(firstTask);
  getDialogAccess().handleTaskCreated(secondTask);
  vi.advanceTimersByTime(1000);
  expect(component.taskCreated.emit).toHaveBeenCalledTimes(1);
  expect(component.taskCreated.emit).toHaveBeenCalledWith(firstTask);
}

/** Registers lifecycle and interaction test cases. */
function registerLifecycleTests(): void {
  it('should create the component and lock page scroll on init', shouldCreateAndLockPageScroll);
  it('should restore page scroll when destroyed', shouldRestorePageScroll);
  it('should stop event propagation on dialog click', shouldStopDialogClickPropagation);
  it('should close dialog with animation and emit closed event', shouldCloseWithAnimation);
}

/** Registers submission and task creation test cases. */
function registerCreationTests(): void {
  it(
    'should not close if the child component is currently submitting',
    shouldNotCloseDuringSubmission,
  );
  it(
    'should handle successful task creation with delayed closing sequence',
    shouldHandleSuccessfulCreation,
  );
  it(
    'should ignore subsequent task creation events if one is already processing',
    shouldIgnoreSubsequentCreationEvents,
  );
}

/** Registers the dialog component test cases. */
function registerTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerLifecycleTests();
  registerCreationTests();
}

describe('AddTaskDialog Component', registerTests);