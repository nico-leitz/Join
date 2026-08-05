import { describe, expect, it } from 'vitest';
import { Task, TaskStatus } from '../models/task.model';
import {
  applyTaskPositionUpdates,
  createDropTaskUpdates,
  createStatusMoveTaskUpdates,
  sortTasks,
} from './task-order.utils';

const TASK_DEFAULTS = {
  description: '',
  dueDate: '2026-07-29',
  priority: 'medium',
  category: 'technical_task',
  updatedAt: '2026-07-29T00:00:00.000Z',
} as const;

const CROSS_COLUMN_IDS = ['in_progress-0', 'todo-2', 'in_progress-1', 'in_progress-2'];

describe('task order utilities', registerTaskOrderTests);

/** Registers the task order utility test cases. */
function registerTaskOrderTests(): void {
  it('moves the fifth task to the second position in the same column', testSameColumnReorder);
  it('inserts a task at the exact target index in another column', testCrossColumnMove);
  it('moves a task to the end of the selected mobile target column', testMobileStatusMove);
  it('returns no updates for a negative source index', testInvalidSourceIndex);
  it('sorts tasks according to the configured board status order', testStatusOrder);
}

/** Verifies reordering inside the same board column. */
function testSameColumnReorder(): void {
  const tasks = createTasks('todo', 5);
  const updates = createDropTaskUpdates(tasks, {
    sourceStatus: 'todo',
    targetStatus: 'todo',
    sourceIndex: 4,
    targetIndex: 1,
  });
  const updatedTasks = applyTaskPositionUpdates(tasks, updates);
  expectColumnIds(updatedTasks, 'todo', ['todo-0', 'todo-4', 'todo-1', 'todo-2', 'todo-3']);
}

/** Verifies insertion at an exact index in another board column. */
function testCrossColumnMove(): void {
  const tasks = [...createTasks('todo', 3), ...createTasks('in_progress', 3)];
  const updates = createDropTaskUpdates(tasks, {
    sourceStatus: 'todo',
    targetStatus: 'in_progress',
    sourceIndex: 2,
    targetIndex: 1,
  });
  const updatedTasks = applyTaskPositionUpdates(tasks, updates);
  expectColumnIds(updatedTasks, 'todo', ['todo-0', 'todo-1']);
  expectColumnIds(updatedTasks, 'in_progress', CROSS_COLUMN_IDS);
}

/** Verifies appending a task through the mobile status move action. */
function testMobileStatusMove(): void {
  const tasks = [...createTasks('todo', 2), ...createTasks('done', 2)];
  const updates = createStatusMoveTaskUpdates(tasks, 'todo-0', 'done');
  const updatedTasks = applyTaskPositionUpdates(tasks, updates);
  expectColumnIds(updatedTasks, 'done', ['done-0', 'done-1', 'todo-0']);
}

/** Verifies that an invalid source index produces no position updates. */
function testInvalidSourceIndex(): void {
  const tasks = createTasks('todo', 3);
  const updates = createDropTaskUpdates(tasks, {
    sourceStatus: 'todo',
    targetStatus: 'todo',
    sourceIndex: -1,
    targetIndex: 0,
  });
  expect(updates).toEqual([]);
}

/** Verifies the configured order of the board status columns. */
function testStatusOrder(): void {
  const tasks = [
    ...createTasks('done', 1),
    ...createTasks('awaiting_feedback', 1),
    ...createTasks('todo', 1),
    ...createTasks('in_progress', 1),
  ];
  const statuses = sortTasks(tasks).map((task) => task.status);
  expect(statuses).toEqual(['todo', 'in_progress', 'awaiting_feedback', 'done']);
}

/**
 * Creates task fixtures belonging to the provided status column.
 * @param status - Status assigned to the created tasks.
 * @param count - Number of task fixtures to create.
 * @returns Created task fixtures.
 */
function createTasks(status: TaskStatus, count: number): Task[] {
  return Array.from({ length: count }, (_, sortOrder) => createTask(status, sortOrder));
}

/**
 * Creates a task fixture at the provided column position.
 * @param status - Status assigned to the task.
 * @param sortOrder - Position assigned inside the status column.
 * @returns Created task fixture.
 */
function createTask(status: TaskStatus, sortOrder: number): Task {
  return {
    ...TASK_DEFAULTS,
    id: `${status}-${sortOrder}`,
    title: `Task ${sortOrder}`,
    status,
    sortOrder,
    createdAt: `2026-07-29T00:00:0${sortOrder}.000Z`,
  };
}

/**
 * Verifies task identifiers in their resolved column order.
 * @param tasks - Tasks to inspect.
 * @param status - Status of the requested column.
 * @param expectedIds - Expected identifiers in column order.
 */
function expectColumnIds(tasks: Task[], status: TaskStatus, expectedIds: string[]): void {
  expect(getColumnIds(tasks, status)).toEqual(expectedIds);
}

/**
 * Returns task identifiers in their resolved column order.
 * @param tasks - Tasks to inspect.
 * @param status - Status of the requested column.
 * @returns Ordered identifiers belonging to the column.
 */
function getColumnIds(tasks: Task[], status: TaskStatus): string[] {
  return tasks
    .filter((task) => task.status === status)
    .sort((firstTask, secondTask) => firstTask.sortOrder - secondTask.sortOrder)
    .map((task) => task.id);
}