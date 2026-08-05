import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { Task } from '../../../../core/models/task.model';

/** Task displayed by the task-card tests. */
export const MOCK_TASK: Task = {
  id: 'task-1',
  title: 'Design System Update',
  description: 'Update the core UI components for the new theme.',
  category: 'technical_task',
  priority: 'urgent',
  status: 'todo',
  dueDate: '2026-08-15',
  sortOrder: 1,
  createdAt: '2026-07-01',
  updatedAt: '2026-07-01',
};

/** Subtasks used to verify task-card progress output. */
export const MOCK_SUBTASKS: Subtask[] = [
  {
    id: 'sub-1',
    taskId: 'task-1',
    title: 'Update Buttons',
    isCompleted: true,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'sub-2',
    taskId: 'task-1',
    title: 'Update Inputs',
    isCompleted: false,
    sortOrder: 1,
    createdAt: '',
    updatedAt: '',
  },
];

/** Contacts used to verify task-card assignment badges. */
export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    firstName: 'Alice',
    lastName: 'Adams',
    email: 'alice@example.com',
    phone: '',
    badgeColor: '#ff0000',
    authUserId: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c-2',
    firstName: 'Bob',
    lastName: 'Builder',
    email: 'bob@example.com',
    phone: '',
    badgeColor: '#00ff00',
    authUserId: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c-3',
    firstName: 'Charlie',
    lastName: 'Chaplin',
    email: 'charlie@example.com',
    phone: '',
    badgeColor: '#0000ff',
    authUserId: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c-4',
    firstName: 'Diana',
    lastName: 'Prince',
    email: 'diana@example.com',
    phone: '',
    badgeColor: '#ff00ff',
    authUserId: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c-5',
    firstName: 'Evan',
    lastName: 'Wright',
    email: 'evan@example.com',
    phone: '',
    badgeColor: '#ffff00',
    authUserId: '',
    createdAt: '',
    updatedAt: '',
  },
];