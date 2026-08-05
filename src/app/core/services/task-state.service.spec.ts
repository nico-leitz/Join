import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Contact } from '../models/contact.model';
import { Subtask } from '../models/subtask.model';
import { Task } from '../models/task.model';
import { TaskStateService } from './task-state.service';

const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: null,
    badgeColor: '#ff0000',
    authUserId: 'auth-1',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
];

const MOCK_SUBTASKS: Subtask[] = [
  {
    id: 'sub-1',
    taskId: 'task-1',
    title: 'Subtask 1',
    sortOrder: 0,
    isCompleted: false,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'sub-2',
    taskId: 'task-1',
    title: 'Subtask 2',
    sortOrder: 1,
    isCompleted: true,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'sub-3',
    taskId: 'task-2',
    title: 'Subtask 3',
    sortOrder: 0,
    isCompleted: false,
    createdAt: '2023-01-02T12:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z',
  },
];

const MOCK_TASKS: Task[] = [
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
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Desc 2',
    dueDate: '2023-12-31',
    priority: 'medium',
    category: 'technical_task',
    status: 'in_progress',
    sortOrder: 1,
    createdAt: '2023-01-02T12:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z',
  },
];

let service: TaskStateService;

const configureTestBed = (): void => {
  TestBed.configureTestingModule({ providers: [TaskStateService] });
  service = TestBed.inject(TaskStateService);
};

const shouldCreateInitializedService = (): void => {
  expect(service).toBeTruthy();
  expect(service.allTasks()).toEqual([]);
  expect(service.selectedTask()).toBeNull();
  expect(service.selectedSubtasks()).toEqual([]);
  expect(service.assignedContacts()).toEqual([]);
};

const shouldSetAllTasks = (): void => {
  service.setTasks(MOCK_TASKS);
  expect(service.allTasks()).toHaveLength(2);
  expect(service.allTasks()[0].id).toBe('task-1');
};

const shouldClearAllTasks = (): void => {
  service.setTasks(MOCK_TASKS);
  service.setTasks([]);
  expect(service.allTasks()).toHaveLength(0);
};

const shouldApplyCreatedTask = (): void => {
  service.applyCreatedTask(MOCK_TASKS[0], [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);
  expect(service.allTasks()).toHaveLength(1);
  expect(service.allTasks()[0].id).toBe('task-1');
  expect(service.selectedTask()?.id).toBe('task-1');
  expect(service.selectedSubtasks()).toHaveLength(1);
  expect(service.assignedContacts()).toHaveLength(1);
};

const shouldIgnoreRelationsForUnselectedUpdate = (): void => {
  service.setTasks(MOCK_TASKS);
  service.selectTask(MOCK_TASKS[0]);
  const updatedTask: Task = { ...MOCK_TASKS[1], title: 'Updated Task 2' };
  service.applyUpdatedTask(updatedTask, MOCK_SUBTASKS, MOCK_CONTACTS);
  const task = service.allTasks().find(({ id }) => id === 'task-2');
  expect(task?.title).toBe('Updated Task 2');
  expect(service.selectedSubtasks()).toHaveLength(0);
  expect(service.assignedContacts()).toHaveLength(0);
};

const shouldApplyRelationsForSelectedUpdate = (): void => {
  service.setTasks(MOCK_TASKS);
  service.selectTask(MOCK_TASKS[0]);
  const updatedTask: Task = { ...MOCK_TASKS[0], title: 'Updated Task 1' };
  service.applyUpdatedTask(updatedTask, [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);
  const task = service.allTasks().find(({ id }) => id === 'task-1');
  expect(task?.title).toBe('Updated Task 1');
  expect(service.selectedTask()?.title).toBe('Updated Task 1');
  expect(service.selectedSubtasks()).toHaveLength(1);
  expect(service.assignedContacts()).toHaveLength(1);
};

const shouldKeepUndefinedRelations = (): void => {
  service.applyCreatedTask(MOCK_TASKS[0], [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);
  const updatedTask: Task = { ...MOCK_TASKS[0], priority: 'urgent' };
  service.applyUpdatedTask(updatedTask, undefined, undefined);
  expect(service.selectedTask()?.priority).toBe('urgent');
  expect(service.selectedSubtasks()).toHaveLength(1);
  expect(service.assignedContacts()).toHaveLength(1);
};

const shouldClearExplicitRelations = (): void => {
  service.applyCreatedTask(MOCK_TASKS[0], [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);
  service.applyUpdatedTask(MOCK_TASKS[0], [], []);
  expect(service.selectedSubtasks()).toHaveLength(0);
  expect(service.assignedContacts()).toHaveLength(0);
};

const shouldAddTask = (): void => {
  service.addTask(MOCK_TASKS[0]);
  service.addTask(MOCK_TASKS[1]);
  expect(service.allTasks()).toHaveLength(2);
  expect(service.allTasks().find(({ id }) => id === 'task-2')).toBeDefined();
};

const shouldUpdateTask = (): void => {
  service.setTasks(MOCK_TASKS);
  service.updateTask({ ...MOCK_TASKS[0], status: 'done' });
  const task = service.allTasks().find(({ id }) => id === 'task-1');
  expect(task?.status).toBe('done');
};

const shouldSyncSelectedTask = (): void => {
  service.setTasks(MOCK_TASKS);
  service.selectTask(MOCK_TASKS[1]);
  service.updateTask({ ...MOCK_TASKS[1], priority: 'urgent' });
  expect(service.selectedTask()?.priority).toBe('urgent');
};

const shouldKeepDifferentSelectedTask = (): void => {
  service.setTasks(MOCK_TASKS);
  service.selectTask(MOCK_TASKS[0]);
  service.updateTask({ ...MOCK_TASKS[1], priority: 'urgent' });
  expect(service.selectedTask()?.priority).toBe('low');
};

const shouldApplyBatchUpdates = (): void => {
  service.setTasks(MOCK_TASKS);
  service.applyTaskUpdates([
    { ...MOCK_TASKS[0], status: 'in_progress' },
    { ...MOCK_TASKS[1], status: 'done' },
  ]);
  const firstTask = service.allTasks().find(({ id }) => id === 'task-1');
  const secondTask = service.allTasks().find(({ id }) => id === 'task-2');
  expect(firstTask?.status).toBe('in_progress');
  expect(secondTask?.status).toBe('done');
};

const shouldSyncSelectedBatchTask = (): void => {
  service.setTasks(MOCK_TASKS);
  service.selectTask(MOCK_TASKS[0]);
  service.applyTaskUpdates([{ ...MOCK_TASKS[0], category: 'technical_task' }]);
  expect(service.selectedTask()?.category).toBe('technical_task');
};

const shouldKeepUnmentionedBatchTask = (): void => {
  service.setTasks(MOCK_TASKS);
  service.applyTaskUpdates([{ ...MOCK_TASKS[0], category: 'technical_task' }]);
  const task = service.allTasks().find(({ id }) => id === 'task-2');
  expect(task?.category).toBe('technical_task');
};

const shouldRemoveTask = (): void => {
  service.setTasks(MOCK_TASKS);
  service.removeTask('task-1');
  expect(service.allTasks()).toHaveLength(1);
  expect(service.allTasks()[0].id).toBe('task-2');
};

const shouldClearRemovedSelection = (): void => {
  service.applyCreatedTask(MOCK_TASKS[0], MOCK_SUBTASKS, MOCK_CONTACTS);
  service.removeTask('task-1');
  expect(service.selectedTask()).toBeNull();
  expect(service.selectedSubtasks()).toHaveLength(0);
  expect(service.assignedContacts()).toHaveLength(0);
};

const shouldKeepSelectionAfterOtherRemoval = (): void => {
  service.setTasks(MOCK_TASKS);
  service.applyCreatedTask(MOCK_TASKS[0], [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);
  service.removeTask('task-2');
  expect(service.selectedTask()?.id).toBe('task-1');
  expect(service.selectedSubtasks()).toHaveLength(1);
  expect(service.assignedContacts()).toHaveLength(1);
};

beforeEach(configureTestBed);

describe('TaskStateService', () => {
  it('should be created and initialized with empty state', shouldCreateInitializedService);
});

describe('setTasks', () => {
  it('should set all tasks to the provided array', shouldSetAllTasks);
  it('should clear tasks when an empty array is provided', shouldClearAllTasks);
});

describe('applyCreatedTask', () => {
  it('should add task, select it, and populate its relation states', shouldApplyCreatedTask);
});

describe('applyUpdatedTask', () => {
  it(
    'should ignore relations if the updated task is not selected',
    shouldIgnoreRelationsForUnselectedUpdate,
  );
  it(
    'should apply relations if the updated task is selected',
    shouldApplyRelationsForSelectedUpdate,
  );
  it('should leave existing relations intact for undefined inputs', shouldKeepUndefinedRelations);
  it('should clear relations for empty array inputs', shouldClearExplicitRelations);
});

describe('addTask', () => {
  it('should add a task to the allTasks state', shouldAddTask);
});

describe('updateTask', () => {
  it('should update task properties in the allTasks array', shouldUpdateTask);
  it('should synchronize the selected task when identifiers match', shouldSyncSelectedTask);
  it('should preserve the selected task when identifiers differ', shouldKeepDifferentSelectedTask);
});

describe('applyTaskUpdates', () => {
  it('should apply updates to multiple tasks at once', shouldApplyBatchUpdates);
  it('should synchronize the selected task when included', shouldSyncSelectedBatchTask);
  it('should leave unmentioned tasks unchanged', shouldKeepUnmentionedBatchTask);
});

describe('removeTask', () => {
  it('should remove a task from the allTasks signal', shouldRemoveTask);
  it('should clear state when the selected task is removed', shouldClearRemovedSelection);
  it(
    'should preserve state when a different task is removed',
    shouldKeepSelectionAfterOtherRemoval,
  );
});