import { describe, expect, it } from 'vitest';
import {
  applyTaskPositionUpdates,
  createDropTaskUpdates,
  createStatusMoveTaskUpdates,
  sortTasks,
} from './task-order.utils';
import {
  Task,
  TaskStatus,
} from '../models/task.model';

describe('task order utilities', () => {
  it('moves the fifth task to the second position in the same column', () => {
    const tasks = createTasks('todo', 5);
    const updates = createDropTaskUpdates(tasks, {
      sourceStatus: 'todo',
      targetStatus: 'todo',
      sourceIndex: 4,
      targetIndex: 1,
    });

    expect(
      applyTaskPositionUpdates(tasks, updates).map(
        (task) => task.id,
      ),
    ).toEqual([
      'todo-0',
      'todo-4',
      'todo-1',
      'todo-2',
      'todo-3',
    ]);
  });

  it('inserts a task at the exact target index in another column', () => {
    const tasks = [
      ...createTasks('todo', 3),
      ...createTasks('in_progress', 3),
    ];
    const updates = createDropTaskUpdates(tasks, {
      sourceStatus: 'todo',
      targetStatus: 'in_progress',
      sourceIndex: 2,
      targetIndex: 1,
    });
    const updatedTasks =
      applyTaskPositionUpdates(tasks, updates);

    expect(getColumnIds(updatedTasks, 'todo')).toEqual([
      'todo-0',
      'todo-1',
    ]);
    expect(
      getColumnIds(updatedTasks, 'in_progress'),
    ).toEqual([
      'in_progress-0',
      'todo-2',
      'in_progress-1',
      'in_progress-2',
    ]);
  });

  it('moves a task to the end of the selected mobile target column', () => {
    const tasks = [
      ...createTasks('todo', 2),
      ...createTasks('done', 2),
    ];
    const updates = createStatusMoveTaskUpdates(
      tasks,
      'todo-0',
      'done',
    );

    expect(
      getColumnIds(
        applyTaskPositionUpdates(tasks, updates),
        'done',
      ),
    ).toEqual([
      'done-0',
      'done-1',
      'todo-0',
    ]);
  });

  it('returns no updates for a negative source index', () => {
    const tasks = createTasks('todo', 3);
    const updates = createDropTaskUpdates(tasks, {
      sourceStatus: 'todo',
      targetStatus: 'todo',
      sourceIndex: -1,
      targetIndex: 0,
    });

    expect(updates).toEqual([]);
  });

  it('sorts tasks according to the configured board status order', () => {
    const tasks = [
      ...createTasks('done', 1),
      ...createTasks('awaiting_feedback', 1),
      ...createTasks('todo', 1),
      ...createTasks('in_progress', 1),
    ];

    expect(
      sortTasks(tasks).map((task) => task.status),
    ).toEqual([
      'todo',
      'in_progress',
      'awaiting_feedback',
      'done',
    ]);
  });
});

/**
 * Creates task fixtures belonging to the provided status column.
 *
 * @param status - Status assigned to the created tasks.
 * @param count - Number of task fixtures to create.
 * @returns Created task fixtures.
 */
function createTasks(
  status: TaskStatus,
  count: number,
): Task[] {
  return Array.from(
    { length: count },
    (_, sortOrder) => ({
      id: `${status}-${sortOrder}`,
      title: `Task ${sortOrder}`,
      description: '',
      dueDate: '2026-07-29',
      priority: 'medium',
      category: 'technical_task',
      status,
      sortOrder,
      createdAt:
        `2026-07-29T00:00:0${sortOrder}.000Z`,
      updatedAt: '2026-07-29T00:00:00.000Z',
    }),
  );
}

/**
 * Returns task identifiers in their resolved column order.
 *
 * @param tasks - Tasks to inspect.
 * @param status - Status of the requested column.
 * @returns Ordered identifiers belonging to the column.
 */
function getColumnIds(
  tasks: Task[],
  status: TaskStatus,
): string[] {
  return tasks
    .filter((task) => task.status === status)
    .sort((firstTask, secondTask) => {
      return firstTask.sortOrder - secondTask.sortOrder;
    })
    .map((task) => task.id);
}