import { Provider, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Contact } from '../models/contact.model';
import { Subtask } from '../models/subtask.model';
import { CreateTask, Task, TaskRow } from '../models/task.model';
import { TaskRepository } from '../repositories/task.repository';
import { TaskRelationsService } from './task-relations.service';
import { TaskStateService } from './task-state.service';
import { TaskService } from './task.service';
import { TaskWorkflowService } from './task-workflow.service';

const REPOSITORY_METHODS = [
  'getTaskRows',
  'getTaskRowById',
  'createTask',
  'updateTask',
  'updateTaskPositions',
  'deleteTask',
  'getSubtaskRows',
  'getAssignedContacts',
] as const;

const RELATION_METHODS = [
  'getSubtasks',
  'getAssignedContacts',
  'loadBoardRelations',
  'createSubtask',
  'updateSubtask',
  'deleteSubtask',
  'createSubtasksForTask',
  'createAssignments',
  'updateOptionalSubtasks',
  'updateOptionalAssignments',
  'replaceSubtasks',
  'assignContact',
  'removeContact',
  'replaceAssignments',
] as const;

const STATE_METHODS = [
  'setTasks',
  'selectTask',
  'setSubtasksForTask',
  'setContactsForTask',
  'addTask',
  'applyCreatedTask',
  'updateTask',
  'applyTaskUpdates',
  'applyUpdatedTask',
  'removeTask',
  'addSubtask',
  'updateSubtask',
  'removeSubtask',
  'setSelectedSubtasks',
  'setAssignedContacts',
] as const;

const WORKFLOW_METHODS = ['createTaskWithRelations', 'updateTaskWithRelations'] as const;

/** Names of repository methods used by task service tests. */
type RepositoryMethod = (typeof REPOSITORY_METHODS)[number];

/** Names of relation methods used by task service tests. */
type RelationMethod = (typeof RELATION_METHODS)[number];

/** Names of state methods used by task service tests. */
type StateMethod = (typeof STATE_METHODS)[number];

/** Names of workflow methods used by task service tests. */
type WorkflowMethod = (typeof WORKFLOW_METHODS)[number];

/** Mocked task repository surface used by the test harnesses. */
export type TaskRepositoryMock = Record<RepositoryMethod, ReturnType<typeof vi.fn>>;

/** Mocked task relation surface used by the test harnesses. */
export type TaskRelationsMock = Record<RelationMethod, ReturnType<typeof vi.fn>>;

/** Mocked task workflow surface used by task service tests. */
export type TaskWorkflowMock = Record<WorkflowMethod, ReturnType<typeof vi.fn>>;

/** Mocked task state surface and exposed signals used by the test harnesses. */
export type TaskStateMock = Record<StateMethod, ReturnType<typeof vi.fn>> & {
  allTasks: WritableSignal<Task[]>;
  selectedTask: WritableSignal<Task | null>;
  selectedSubtasks: WritableSignal<Subtask[]>;
  assignedContacts: WritableSignal<Contact[]>;
};

/** Dependencies and service instance created for a task service test. */
export interface TaskServiceHarness {
  /** Task service under test. */
  service: TaskService;
  /** Mocked task repository. */
  repository: TaskRepositoryMock;
  /** Mocked relation service. */
  relations: TaskRelationsMock;
  /** Mocked state service. */
  state: TaskStateMock;
  /** Mocked workflow service. */
  workflow: TaskWorkflowMock;
}

/** Dependencies and service instance created for a workflow test. */
export interface TaskWorkflowHarness {
  /** Workflow service under test. */
  service: TaskWorkflowService;
  /** Mocked task repository. */
  repository: TaskRepositoryMock;
  /** Mocked relation service. */
  relations: TaskRelationsMock;
  /** Mocked state service. */
  state: TaskStateMock;
}

/** Persisted task rows shared by task service tests. */
export const MOCK_TASK_ROWS: TaskRow[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Desc 1',
    due_date: '2023-12-31',
    priority: 'low',
    category: 'user_story',
    status: 'todo',
    sort_order: 0,
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Desc 2',
    due_date: '2023-12-31',
    priority: 'medium',
    category: 'technical_task',
    status: 'in_progress',
    sort_order: 1,
    created_at: '2023-01-02T12:00:00Z',
    updated_at: '2023-01-02T12:00:00Z',
  },
];

/** Application task entities shared by task service tests. */
export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Desc 1',
    dueDate: '2023-12-31',
    priority: 'low',
    category: 'user_story',
    status: 'todo',
    sortOrder: 0,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
];

/** Application subtasks shared by task service tests. */
export const MOCK_SUBTASKS: Subtask[] = [
  {
    id: 'sub-1',
    taskId: 'task-1',
    title: 'Subtask 1',
    sortOrder: 0,
    isCompleted: false,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
];

/** Assigned contacts shared by task service tests. */
export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    phone: null,
    badgeColor: '#ff0000',
    authUserId: 'auth-1',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
];

/** Valid task creation input shared by task service tests. */
export const VALID_CREATE_TASK: CreateTask = {
  title: 'New Task',
  dueDate: '2023-12-31',
  category: 'user_story',
};

const createMethodMocks = <T extends readonly string[]>(
  methods: T,
): Record<T[number], ReturnType<typeof vi.fn>> => {
  return Object.fromEntries(methods.map((method) => [method, vi.fn()])) as Record<
    T[number],
    ReturnType<typeof vi.fn>
  >;
};

const createRepositoryMock = (): TaskRepositoryMock => {
  return createMethodMocks(REPOSITORY_METHODS);
};

const createRelationsMock = (): TaskRelationsMock => {
  return createMethodMocks(RELATION_METHODS);
};

const createStateMock = (): TaskStateMock => ({
  ...createMethodMocks(STATE_METHODS),
  allTasks: signal<Task[]>([]),
  selectedTask: signal<Task | null>(null),
  selectedSubtasks: signal<Subtask[]>([]),
  assignedContacts: signal<Contact[]>([]),
});

const createWorkflowMock = (): TaskWorkflowMock => {
  return createMethodMocks(WORKFLOW_METHODS);
};

const createTaskServiceProviders = (
  repository: TaskRepositoryMock,
  relations: TaskRelationsMock,
  state: TaskStateMock,
  workflow: TaskWorkflowMock,
): Provider[] => [
  TaskService,
  { provide: TaskRepository, useValue: repository },
  { provide: TaskRelationsService, useValue: relations },
  { provide: TaskStateService, useValue: state },
  { provide: TaskWorkflowService, useValue: workflow },
];

const createWorkflowProviders = (
  repository: TaskRepositoryMock,
  relations: TaskRelationsMock,
  state: TaskStateMock,
): Provider[] => [
  TaskWorkflowService,
  { provide: TaskRepository, useValue: repository },
  { provide: TaskRelationsService, useValue: relations },
  { provide: TaskStateService, useValue: state },
];

/**
 * Creates a TaskService with typed mocked dependencies.
 * @returns Configured task service test harness.
 */
export const createTaskServiceHarness = (): TaskServiceHarness => {
  const repository = createRepositoryMock();
  const relations = createRelationsMock();
  const state = createStateMock();
  const workflow = createWorkflowMock();
  const providers = createTaskServiceProviders(repository, relations, state, workflow);
  TestBed.configureTestingModule({ providers });
  const service = TestBed.inject(TaskService);
  return { service, repository, relations, state, workflow };
};

/**
 * Creates a TaskWorkflowService with typed mocked dependencies.
 * @returns Configured workflow service test harness.
 */
export const createTaskWorkflowHarness = (): TaskWorkflowHarness => {
  const repository = createRepositoryMock();
  const relations = createRelationsMock();
  const state = createStateMock();
  const providers = createWorkflowProviders(repository, relations, state);
  TestBed.configureTestingModule({ providers });
  const service = TestBed.inject(TaskWorkflowService);
  return { service, repository, relations, state };
};