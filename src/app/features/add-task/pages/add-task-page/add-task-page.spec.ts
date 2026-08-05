import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Task } from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';
import {
  ContactServiceMock,
  TaskServiceMock,
  createContactServiceMock,
  createTaskServiceMock,
} from '../../components/add-task-content/add-task-content-test.utils';
import { AddTaskPage } from './add-task-page';

/** Mocked route surface used by the page tests. */
interface ActivatedRouteMock {
  snapshot: {
    queryParamMap: {
      get: ReturnType<typeof vi.fn>;
    };
  };
}

/** Test-accessible surface of the task page. */
interface PageTestAccess {
  /** Starts the delayed board redirect after task creation. */
  handleTaskCreated(task: Task): void;
}

let component: AddTaskPage;
let fixture: ComponentFixture<AddTaskPage>;
let router: Router;
let mockActivatedRoute: ActivatedRouteMock;
let mockTaskService: TaskServiceMock;
let mockContactService: ContactServiceMock;

/**
 * Creates the route mock used by each page test.
 * @returns Fresh activated route mock.
 */
function createActivatedRouteMock(): ActivatedRouteMock {
  return {
    snapshot: {
      queryParamMap: {
        get: vi.fn().mockReturnValue(null),
      },
    },
  };
}

/** Configures the page component testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [AddTaskPage],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: mockActivatedRoute },
      { provide: TaskService, useValue: mockTaskService },
      { provide: ContactService, useValue: mockContactService },
    ],
  }).compileComponents();
}

/** Creates a fresh page fixture and its dependency mocks. */
async function setupComponent(): Promise<void> {
  mockActivatedRoute = createActivatedRouteMock();
  mockTaskService = createTaskServiceMock();
  mockContactService = createContactServiceMock();
  await configureTestBed();
  fixture = TestBed.createComponent(AddTaskPage);
  component = fixture.componentInstance;
  router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  vi.useFakeTimers();
}

/** Restores real timers after each page test. */
function cleanUpComponent(): void {
  vi.useRealTimers();
}

/**
 * Exposes protected page methods for direct unit testing.
 * @returns Test-accessible page surface.
 */
function getPageAccess(): PageTestAccess {
  return component as unknown as PageTestAccess;
}

/**
 * Creates the minimal task emitted by the task form.
 * @returns Task used to start the redirect flow.
 */
function createMockTask(): Task {
  return { id: 'task-1' } as Task;
}

/** Verifies successful page component creation. */
function shouldCreateComponent(): void {
  fixture.detectChanges();
  expect(component).toBeTruthy();
}

/** Verifies initialization from a valid route status. */
function shouldReadValidTaskStatus(): void {
  mockActivatedRoute.snapshot.queryParamMap.get.mockReturnValue('in_progress');
  component.ngOnInit();
  expect(component.taskStatus()).toBe('in_progress');
}

/** Verifies that an invalid route status preserves the default. */
function shouldIgnoreInvalidTaskStatus(): void {
  mockActivatedRoute.snapshot.queryParamMap.get.mockReturnValue('invalid_status');
  component.ngOnInit();
  expect(component.taskStatus()).toBe('todo');
}

/** Verifies navigation after the configured redirect delay. */
function shouldNavigateAfterDelay(): void {
  getPageAccess().handleTaskCreated(createMockTask());
  expect(router.navigate).not.toHaveBeenCalled();
  vi.advanceTimersByTime(800);
  expect(router.navigate).toHaveBeenCalledWith(['/board']);
}

/** Verifies that repeated creation events restart the redirect timer. */
function shouldResetRedirectTimer(): void {
  getPageAccess().handleTaskCreated(createMockTask());
  vi.advanceTimersByTime(400);
  getPageAccess().handleTaskCreated(createMockTask());
  vi.advanceTimersByTime(400);
  expect(router.navigate).not.toHaveBeenCalled();
  vi.advanceTimersByTime(400);
  expect(router.navigate).toHaveBeenCalledWith(['/board']);
}

/** Verifies that component destruction cancels the redirect. */
function shouldClearRedirectTimer(): void {
  getPageAccess().handleTaskCreated(createMockTask());
  component.ngOnDestroy();
  vi.advanceTimersByTime(800);
  expect(router.navigate).not.toHaveBeenCalled();
}

/** Registers route initialization test cases. */
function registerInitializationTests(): void {
  it('should create the component', shouldCreateComponent);
  it('should read a valid task status from query parameters on init', shouldReadValidTaskStatus);
  it(
    'should ignore invalid task status from query parameters and keep default',
    shouldIgnoreInvalidTaskStatus,
  );
}

/** Registers board redirect test cases. */
function registerRedirectTests(): void {
  it(
    'should navigate to board after an 800ms delay when a task is created',
    shouldNavigateAfterDelay,
  );
  it(
    'should reset the timer if handleTaskCreated is called multiple times',
    shouldResetRedirectTimer,
  );
  it('should clear the redirect timer on component destruction', shouldClearRedirectTimer);
}

/** Registers the task page test cases. */
function registerTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerInitializationTests();
  registerRedirectTests();
}

describe('AddTaskPage Component', registerTests);