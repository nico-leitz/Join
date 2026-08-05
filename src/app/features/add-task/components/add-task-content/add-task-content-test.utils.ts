import { WritableSignal, signal } from '@angular/core';
import { vi } from 'vitest';
import { Contact } from '../../../../core/models/contact.model';
import { CreateTaskWithRelationsInput } from '../../../../core/models/task-persistence.model';
import { Task } from '../../../../core/models/task.model';

/** Mocked task service surface used by the component tests. */
export interface TaskServiceMock {
  allTasks: WritableSignal<Task[]>;
  getTasks: ReturnType<typeof vi.fn>;
  createTaskWithRelations: ReturnType<typeof vi.fn>;
}

/** Mocked contact service surface used by the component tests. */
export interface ContactServiceMock {
  allContacts: WritableSignal<Contact[]>;
  getContacts: ReturnType<typeof vi.fn>;
}

/** Contacts returned by the component test service. */
export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c1',
    authUserId: 'u1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '123',
    badgeColor: '#ff0000',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c2',
    authUserId: 'u2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '456',
    badgeColor: '#00ff00',
    createdAt: '',
    updatedAt: '',
  },
];

/** Tasks exposed through the component test service. */
export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Existing Task',
    description: '',
    category: 'technical_task',
    priority: 'medium',
    status: 'todo',
    dueDate: '2050-01-01',
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  },
];

/**
 * Creates the task service mock used by each component test.
 * @returns Fresh task service mock.
 */
export function createTaskServiceMock(): TaskServiceMock {
  return {
    allTasks: signal<Task[]>(MOCK_TASKS),
    getTasks: vi.fn().mockResolvedValue(MOCK_TASKS),
    createTaskWithRelations: vi.fn().mockResolvedValue({ id: 't2', title: 'New Task' }),
  };
}

/**
 * Creates the contact service mock used by each component test.
 * @returns Fresh contact service mock.
 */
export function createContactServiceMock(): ContactServiceMock {
  return {
    allContacts: signal<Contact[]>([]),
    getContacts: vi.fn().mockResolvedValue(MOCK_CONTACTS),
  };
}

/**
 * Creates the expected relation input for a successful task submission.
 * @param dueDate - Due date included in the submitted task.
 * @returns Expected task and relation input.
 */
export function createExpectedInput(dueDate: string): CreateTaskWithRelationsInput {
  const task = {
    title: 'Integration Test Task',
    description: 'Test description',
    dueDate,
    priority: 'low' as const,
    category: 'user_story' as const,
    status: 'todo' as const,
    sortOrder: 1,
  };
  return { task, subtasks: [{ title: 'Subtask 1', sortOrder: 0 }], contactIds: ['c2'] };
}