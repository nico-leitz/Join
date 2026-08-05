import { CdkDragDrop, DropListOrientation } from '@angular/cdk/drag-drop';
import { WritableSignal, signal } from '@angular/core';
import { vi } from 'vitest';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { TaskAssignmentRow } from '../../../../core/models/task-assignment.model';
import { TaskPositionUpdate, Task } from '../../../../core/models/task.model';
import { BoardRelationsData } from '../../../../core/services/task.service';

/** Task-service surface used by board component tests. */
export interface TaskServiceMock {
  allTasks: WritableSignal<Task[]>;
  selectedTask: WritableSignal<Task | null>;
  selectedSubtasks: WritableSignal<Subtask[]>;
  assignedContacts: WritableSignal<Contact[]>;
  getTasks: ReturnType<typeof vi.fn<() => Promise<Task[]>>>;
  loadAllBoardData: ReturnType<typeof vi.fn<() => Promise<BoardRelationsData>>>;
  updateTaskPositions: ReturnType<typeof vi.fn<(updates: TaskPositionUpdate[]) => Promise<void>>>;
}

/** Contact-service surface used by board component tests. */
export interface ContactServiceMock {
  allContacts: WritableSignal<Contact[]>;
  getContacts: ReturnType<typeof vi.fn<() => Promise<Contact[]>>>;
}

/** Horizontal-scroll-service surface used by board component tests. */
export interface ScrollServiceMock {
  isMobileViewport: WritableSignal<boolean>;
  dropListOrientation: WritableSignal<DropListOrientation>;
  start: ReturnType<typeof vi.fn>;
  move: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  updateViewport: ReturnType<typeof vi.fn>;
  consumeSuppressedCardClick: ReturnType<typeof vi.fn<() => boolean>>;
}

/** Tasks spanning the board statuses covered by the tests. */
export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Setup Environment',
    description: 'Install dependencies',
    category: 'technical_task',
    priority: 'urgent',
    status: 'todo',
    dueDate: '2026-07-30',
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'task-2',
    title: 'Design UI',
    description: 'Create Figma prototypes',
    category: 'user_story',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2026-08-01',
    sortOrder: 1,
    createdAt: '',
    updatedAt: '',
  },
];

/** Contact used by task-assignment mapping tests. */
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
];

/** Subtask used by board relation tests. */
export const MOCK_SUBTASKS: Subtask[] = [
  {
    id: 'sub-1',
    taskId: 'task-1',
    title: 'NPM Install',
    isCompleted: true,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  },
];

/** Assignment linking the task and contact fixtures. */
export const MOCK_ASSIGNMENTS: TaskAssignmentRow[] = [
  {
    task_id: 'task-1',
    contact_id: 'c-1',
    created_at: '',
  },
];

/**
 * Creates a fresh task-service mock.
 * @returns Task service state and persistence spies.
 */
export function createTaskServiceMock(): TaskServiceMock {
  return {
    allTasks: signal([...MOCK_TASKS]),
    selectedTask: signal<Task | null>(null),
    selectedSubtasks: signal<Subtask[]>([]),
    assignedContacts: signal<Contact[]>([]),
    getTasks: vi.fn().mockResolvedValue([...MOCK_TASKS]),
    loadAllBoardData: vi.fn().mockResolvedValue({
      subtasks: [...MOCK_SUBTASKS],
      assignments: [...MOCK_ASSIGNMENTS],
    }),
    updateTaskPositions: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Creates a fresh contact-service mock.
 * @returns Contact service state and loading spy.
 */
export function createContactServiceMock(): ContactServiceMock {
  return {
    allContacts: signal([...MOCK_CONTACTS]),
    getContacts: vi.fn().mockResolvedValue([...MOCK_CONTACTS]),
  };
}

/**
 * Creates a fresh horizontal-scroll-service mock.
 * @returns Responsive state and pointer interaction spies.
 */
export function createScrollServiceMock(): ScrollServiceMock {
  return {
    isMobileViewport: signal(false),
    dropListOrientation: signal<DropListOrientation>('horizontal'),
    start: vi.fn(),
    move: vi.fn(),
    end: vi.fn(),
    updateViewport: vi.fn(),
    consumeSuppressedCardClick: vi.fn().mockReturnValue(false),
  };
}

/**
 * Creates a valid cross-column CDK drop event.
 * @returns Drag-and-drop event moving the first task to in-progress.
 */
export function createDropEvent(): CdkDragDrop<Task[]> {
  return {
    previousContainer: { id: 'todo' },
    container: { id: 'in_progress' },
    previousIndex: 0,
    currentIndex: 0,
  } as CdkDragDrop<Task[]>;
}