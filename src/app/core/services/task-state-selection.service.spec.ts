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
  {
    id: 'contact-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1234567890',
    badgeColor: '#00ff00',
    authUserId: 'auth-2',
    createdAt: '2023-01-02T12:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z',
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

const shouldSelectTask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  expect(service.selectedTask()).toEqual(MOCK_TASKS[0]);
};

const shouldClearSelectedTask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.selectTask(null);
  expect(service.selectedTask()).toBeNull();
};

const shouldSetSelectedSubtasks = (): void => {
  service.setSelectedSubtasks(MOCK_SUBTASKS);
  expect(service.selectedSubtasks()).toHaveLength(3);
  expect(service.selectedSubtasks()[0].id).toBe('sub-1');
};

const shouldSetAssignedContacts = (): void => {
  service.setAssignedContacts(MOCK_CONTACTS);
  expect(service.assignedContacts()).toHaveLength(2);
  expect(service.assignedContacts()[1].id).toBe('contact-2');
};

const shouldSetSubtasksForSelectedTask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.setSubtasksForTask('task-1', MOCK_SUBTASKS.slice(0, 2));
  expect(service.selectedSubtasks()).toHaveLength(2);
};

const shouldIgnoreSubtasksForOtherTask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.setSubtasksForTask('task-2', [MOCK_SUBTASKS[2]]);
  expect(service.selectedSubtasks()).toHaveLength(0);
};

const shouldIgnoreSubtasksWithoutSelection = (): void => {
  service.setSubtasksForTask('task-1', MOCK_SUBTASKS);
  expect(service.selectedSubtasks()).toHaveLength(0);
};

const shouldSetContactsForSelectedTask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.setContactsForTask('task-1', MOCK_CONTACTS);
  expect(service.assignedContacts()).toHaveLength(2);
};

const shouldIgnoreContactsForOtherTask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.setContactsForTask('task-2', MOCK_CONTACTS);
  expect(service.assignedContacts()).toHaveLength(0);
};

const shouldIgnoreContactsWithoutSelection = (): void => {
  service.setContactsForTask('task-1', MOCK_CONTACTS);
  expect(service.assignedContacts()).toHaveLength(0);
};

const shouldClearSelection = (): void => {
  service.applyCreatedTask(MOCK_TASKS[0], MOCK_SUBTASKS, MOCK_CONTACTS);
  service.clearSelection();
  expect(service.selectedTask()).toBeNull();
  expect(service.selectedSubtasks()).toEqual([]);
  expect(service.assignedContacts()).toEqual([]);
};

const shouldAddMatchingSubtask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.addSubtask(MOCK_SUBTASKS[0]);
  service.addSubtask(MOCK_SUBTASKS[1]);
  expect(service.selectedSubtasks()).toHaveLength(2);
  expect(service.selectedSubtasks().find(({ id }) => id === 'sub-2')).toBeDefined();
};

const shouldIgnoreForeignSubtask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.addSubtask(MOCK_SUBTASKS[2]);
  expect(service.selectedSubtasks()).toHaveLength(0);
};

const shouldIgnoreSubtaskWithoutSelection = (): void => {
  service.addSubtask(MOCK_SUBTASKS[0]);
  expect(service.selectedSubtasks()).toHaveLength(0);
};

const shouldUpdateSubtask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.setSelectedSubtasks(MOCK_SUBTASKS.slice(0, 2));
  service.updateSubtask({ ...MOCK_SUBTASKS[0], isCompleted: true });
  const subtask = service.selectedSubtasks().find(({ id }) => id === 'sub-1');
  expect(subtask?.isCompleted).toBe(true);
  expect(service.selectedSubtasks()).toHaveLength(2);
};

const shouldKeepSubtasksForUnknownUpdate = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.setSelectedSubtasks([MOCK_SUBTASKS[0]]);
  service.updateSubtask({ ...MOCK_SUBTASKS[2], title: 'Unknown Modification' });
  const subtask = service.selectedSubtasks().find(({ id }) => id === 'sub-1');
  expect(subtask?.title).toBe('Subtask 1');
  expect(service.selectedSubtasks()).toHaveLength(1);
};

const shouldRemoveSubtask = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.setSelectedSubtasks(MOCK_SUBTASKS.slice(0, 2));
  service.removeSubtask('sub-1');
  expect(service.selectedSubtasks()).toHaveLength(1);
  expect(service.selectedSubtasks()[0].id).toBe('sub-2');
};

const shouldKeepSubtasksForUnknownRemoval = (): void => {
  service.selectTask(MOCK_TASKS[0]);
  service.setSelectedSubtasks([MOCK_SUBTASKS[0]]);
  service.removeSubtask('unknown-subtask-id');
  expect(service.selectedSubtasks()).toHaveLength(1);
  expect(service.selectedSubtasks()[0].id).toBe('sub-1');
};

beforeEach(configureTestBed);

describe('selectTask', () => {
  it('should set the selected task', shouldSelectTask);
  it('should clear the selected task when null is passed', shouldClearSelectedTask);
});

describe('setSelectedSubtasks', () => {
  it('should replace the selected subtasks signal', shouldSetSelectedSubtasks);
});

describe('setAssignedContacts', () => {
  it('should replace the assigned contacts signal', shouldSetAssignedContacts);
});

describe('setSubtasksForTask', () => {
  it('should update subtasks for the selected task', shouldSetSubtasksForSelectedTask);
  it('should ignore subtasks for another task', shouldIgnoreSubtasksForOtherTask);
  it('should ignore subtasks when no task is selected', shouldIgnoreSubtasksWithoutSelection);
});

describe('setContactsForTask', () => {
  it('should update contacts for the selected task', shouldSetContactsForSelectedTask);
  it('should ignore contacts for another task', shouldIgnoreContactsForOtherTask);
  it('should ignore contacts when no task is selected', shouldIgnoreContactsWithoutSelection);
});

describe('clearSelection', () => {
  it('should clear the selected task and relation arrays', shouldClearSelection);
});

describe('addSubtask', () => {
  it('should add a subtask belonging to the selected task', shouldAddMatchingSubtask);
  it('should ignore a subtask belonging to another task', shouldIgnoreForeignSubtask);
  it('should ignore a subtask when no task is selected', shouldIgnoreSubtaskWithoutSelection);
});

describe('updateSubtask', () => {
  it('should replace a matching subtask', shouldUpdateSubtask);
  it('should preserve state for an unknown subtask', shouldKeepSubtasksForUnknownUpdate);
});

describe('removeSubtask', () => {
  it('should remove a subtask by its identifier', shouldRemoveSubtask);
  it('should preserve state for an unknown identifier', shouldKeepSubtasksForUnknownRemoval);
});