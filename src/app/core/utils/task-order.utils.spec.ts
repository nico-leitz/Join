import { describe, expect, it } from 'vitest';
import {
  createDropTaskUpdates,
  createStatusMoveTaskUpdates,
} from './task-order.utils';
import { Task, TaskStatus } from '../models/task.model';

describe('task order utilities', () => {
  it('moves the fifth task to the second position in the same column', () => {
    const tasks = createTasks('todo', 5);
    const updates = createDropTaskUpdates(tasks, {
      sourceStatus: 'todo',
      targetStatus: 'todo',
      sourceIndex: 4,
      targetIndex: 1,
    });

    expect(applyUpdates(tasks, updates).map((task) => task.id)).toEqual([
      'todo-0',
      'todo-4',
      'todo-1',
      'todo-2',
      'todo-3',
    ]);
  });

  it('inserts a task at the exact target index in another column', () => {
    const tasks = [...createTasks('todo', 3), ...createTasks('in_progress', 3)];
    const updates = createDropTaskUpdates(tasks, {
      sourceStatus: 'todo',
      targetStatus: 'in_progress',
      sourceIndex: 2,
      targetIndex: 1,
    });

    expect(getColumnIds(applyUpdates(tasks, updates), 'in_progress')).toEqual([
      'in_progress-0',
      'todo-2',
      'in_progress-1',
      'in_progress-2',
    ]);
  });

  it('moves a task to the end of the selected mobile target column', () => {
    const tasks = [...createTasks('todo', 2), ...createTasks('done', 2)];
    const updates = createStatusMoveTaskUpdates(tasks, 'todo-0', 'done');

    expect(getColumnIds(applyUpdates(tasks, updates), 'done')).toEqual([
      'done-0',
      'done-1',
      'todo-0',
    ]);
  });
});

function createTasks(status: TaskStatus, count: number): Task[] {
  return Array.from({ length: count }, (_, sortOrder) => ({
    id: `${status}-${sortOrder}`,
    title: `Task ${sortOrder}`,
    description: '',
    dueDate: '2026-07-29',
    priority: 'medium',
    category: 'technical_task',
    status,
    sortOrder,
    createdAt: `2026-07-29T00:00:0${sortOrder}.000Z`,
    updatedAt: '2026-07-29T00:00:00.000Z',
  }));
}

function applyUpdates(
  tasks: Task[],
  updates: ReturnType<typeof createDropTaskUpdates>,
): Task[] {
  const updatesById = new Map(updates.map((update) => [update.id, update]));

  return tasks
    .map((task) => ({ ...task, ...updatesById.get(task.id) }))
    .sort(
      (firstTask, secondTask) => firstTask.sortOrder - secondTask.sortOrder,
    );
}

function getColumnIds(tasks: Task[], status: TaskStatus): string[] {
  return tasks
    .filter((task) => task.status === status)
    .sort((firstTask, secondTask) => firstTask.sortOrder - secondTask.sortOrder)
    .map((task) => task.id);
}
