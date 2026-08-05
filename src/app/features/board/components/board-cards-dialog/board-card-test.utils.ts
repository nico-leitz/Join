import { WritableSignal, signal } from '@angular/core';
import { vi } from 'vitest';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { UpdateTaskWithRelationsInput } from '../../../../core/models/task-persistence.model';
import { Task } from '../../../../core/models/task.model';
import { TaskDialogUpdate } from './board-cards-dialog';

/** Mocked task service surface used by the dialog tests. */
export interface BoardTaskServiceMock {
  /** Subtasks exposed after relation persistence. */
  selectedSubtasks: WritableSignal<Subtask[]>;

  /** Contacts exposed after relation persistence. */
  assignedContacts: WritableSignal<Contact[]>;

  /** Mocked subtask completion operation. */
  toggleSubtaskCompletion: ReturnType<typeof vi.fn>;

  /** Mocked task deletion operation. */
  deleteTask: ReturnType<typeof vi.fn>;

  /** Mocked task and relation update operation. */
  updateTaskWithRelations: ReturnType<typeof vi.fn>;
}

/** Task displayed by the dialog tests. */
export const MOCK_TASK: Task = {
  id: 'task-1',
  title: 'Review PRs',
  description: 'Review pending pull requests',
  category: 'technical_task',
  priority: 'urgent',
  status: 'in_progress',
  dueDate: '2026-07-30',
  sortOrder: 0,
  createdAt: '',
  updatedAt: '',
};

/** Subtasks belonging to the displayed task. */
export const MOCK_SUBTASKS: Subtask[] = [
  {
    id: 'sub-1',
    taskId: 'task-1',
    title: 'Backend PR',
    isCompleted: false,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  },
];

/** Contacts available for assignment in the dialog tests. */
export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '',
    badgeColor: '#ff0000',
    authUserId: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '',
    badgeColor: '#00ff00',
    authUserId: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c-3',
    firstName: 'Bob',
    lastName: 'Ross',
    email: 'bob@example.com',
    phone: '',
    badgeColor: '#0000ff',
    authUserId: '',
    createdAt: '',
    updatedAt: '',
  },
];

/** Task returned after a successful update. */
export const UPDATED_TASK: Task = {
  ...MOCK_TASK,
  title: 'Updated Title',
};

/** Expected persistence input for a successful dialog update. */
export const EXPECTED_UPDATE_INPUT: UpdateTaskWithRelationsInput = {
  task: {
    title: 'Updated Title',
    description: 'New Desc',
    dueDate: '2026-07-30',
    priority: 'urgent',
    category: 'technical_task',
  },
  subtasks: [
    {
      id: 'sub-1',
      title: 'Backend PR',
      isCompleted: false,
      sortOrder: 0,
    },
  ],
  contactIds: ['c-1'],
};

/** Expected output after a successful dialog update. */
export const EXPECTED_DIALOG_UPDATE: TaskDialogUpdate = {
  task: UPDATED_TASK,
  subtasks: MOCK_SUBTASKS,
  assignedContacts: [MOCK_CONTACTS[0]],
};

/**
 * Creates the task service mock used by each dialog test.
 * @returns Fresh task service mock.
 */
export function createBoardTaskServiceMock(): BoardTaskServiceMock {
  return {
    selectedSubtasks: signal([...MOCK_SUBTASKS]),
    assignedContacts: signal([MOCK_CONTACTS[0]]),
    toggleSubtaskCompletion: vi.fn(),
    deleteTask: vi.fn(),
    updateTaskWithRelations: vi.fn(),
  };
}