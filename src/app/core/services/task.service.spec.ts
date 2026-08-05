import { beforeEach, describe, expect, it } from 'vitest';
import {
  MOCK_TASK_ROWS,
  MOCK_TASKS,
  TaskServiceHarness,
  VALID_CREATE_TASK,
  createTaskServiceHarness,
} from './task-service-test.utils';

let harness: TaskServiceHarness;

const configureTestBed = (): void => {
  harness = createTaskServiceHarness();
};

const shouldCreateService = (): void => {
  expect(harness.service).toBeTruthy();
  expect(harness.service.allTasks()).toEqual([]);
  expect(harness.service.isLoading()).toBe(false);
  expect(harness.service.errorMessage()).toBe('');
};

const shouldLoadTasks = async (): Promise<void> => {
  harness.repository.getTaskRows.mockResolvedValue(MOCK_TASK_ROWS);
  const result = await harness.service.getTasks();
  expect(harness.repository.getTaskRows).toHaveBeenCalled();
  expect(harness.state.setTasks).toHaveBeenCalledWith(expect.any(Array));
  expect(result).toHaveLength(2);
  expect(result[0].id).toBe('task-1');
  expect(harness.service.isLoading()).toBe(false);
};

const shouldExposeTaskLoadError = async (): Promise<void> => {
  harness.repository.getTaskRows.mockRejectedValue(new Error('Network Error'));
  await expect(harness.service.getTasks()).rejects.toThrow('Network Error');
  expect(harness.service.errorMessage()).toBe('Tasks could not be loaded.');
  expect(harness.service.isLoading()).toBe(false);
};

const shouldLoadTaskById = async (): Promise<void> => {
  harness.repository.getTaskRowById.mockResolvedValue(MOCK_TASK_ROWS[0]);
  const result = await harness.service.getTaskById('task-1');
  expect(harness.repository.getTaskRowById).toHaveBeenCalledWith('task-1');
  expect(harness.state.selectTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
  expect(result?.id).toBe('task-1');
};

const shouldClearMissingTaskSelection = async (): Promise<void> => {
  harness.repository.getTaskRowById.mockResolvedValue(null);
  const result = await harness.service.getTaskById('unknown');
  expect(harness.state.selectTask).toHaveBeenCalledWith(null);
  expect(result).toBeNull();
};

const shouldCreateTask = async (): Promise<void> => {
  harness.repository.createTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
  const result = await harness.service.createTask(VALID_CREATE_TASK);
  expect(harness.repository.createTask).toHaveBeenCalledWith(VALID_CREATE_TASK);
  expect(harness.state.addTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
  expect(harness.state.selectTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
  expect(result.id).toBe('task-1');
};

const shouldExposeTaskCreationError = async (): Promise<void> => {
  harness.repository.createTask.mockRejectedValue(new Error('Creation Failed'));
  await expect(harness.service.createTask(VALID_CREATE_TASK)).rejects.toThrow('Creation Failed');
  expect(harness.service.errorMessage()).toBe('Task could not be created.');
};

const shouldDelegateTaskCreationWorkflow = async (): Promise<void> => {
  const input = { task: VALID_CREATE_TASK, subtasks: [{ title: 'Sub 1' }] };
  harness.workflow.createTaskWithRelations.mockResolvedValue(MOCK_TASKS[0]);
  const result = await harness.service.createTaskWithRelations(input);
  expect(harness.workflow.createTaskWithRelations).toHaveBeenCalledWith(input);
  expect(result).toEqual(MOCK_TASKS[0]);
};

const shouldExposeTaskCreationWorkflowError = async (): Promise<void> => {
  const input = { task: VALID_CREATE_TASK };
  harness.workflow.createTaskWithRelations.mockRejectedValue(new Error('Creation Failed'));
  await expect(harness.service.createTaskWithRelations(input)).rejects.toThrow('Creation Failed');
  expect(harness.service.errorMessage()).toBe('Task and its relations could not be created.');
};

const shouldUpdateTask = async (): Promise<void> => {
  const update = { title: 'Updated' };
  harness.repository.updateTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
  const result = await harness.service.updateTask('task-1', update);
  expect(harness.repository.updateTask).toHaveBeenCalledWith('task-1', update);
  expect(harness.state.updateTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
  expect(result.id).toBe('task-1');
};

const shouldSaveTaskPositions = async (): Promise<void> => {
  const updates = [{ id: 'task-1', status: 'done' as const, sortOrder: 5 }];
  harness.repository.updateTaskPositions.mockResolvedValue(MOCK_TASK_ROWS);
  await harness.service.updateTaskPositions(updates);
  expect(harness.repository.updateTaskPositions).toHaveBeenCalledWith(updates);
  expect(harness.state.applyTaskUpdates).toHaveBeenCalledWith(expect.any(Array));
};

const shouldDelegateTaskUpdateWorkflow = async (): Promise<void> => {
  const input = { task: { title: 'Updated Task' }, subtasks: [] };
  harness.workflow.updateTaskWithRelations.mockResolvedValue(MOCK_TASKS[0]);
  const result = await harness.service.updateTaskWithRelations('task-1', input);
  expect(harness.workflow.updateTaskWithRelations).toHaveBeenCalledWith('task-1', input);
  expect(result).toEqual(MOCK_TASKS[0]);
};

const shouldExposeTaskUpdateWorkflowError = async (): Promise<void> => {
  const input = { task: { title: 'Updated Task' } };
  harness.workflow.updateTaskWithRelations.mockRejectedValue(new Error('Update Failed'));
  await expect(harness.service.updateTaskWithRelations('task-1', input)).rejects.toThrow(
    'Update Failed',
  );
  expect(harness.service.errorMessage()).toBe('Task and its relations could not be updated.');
};

const shouldDeleteTask = async (): Promise<void> => {
  harness.repository.deleteTask.mockResolvedValue(undefined);
  await harness.service.deleteTask('task-1');
  expect(harness.repository.deleteTask).toHaveBeenCalledWith('task-1');
  expect(harness.state.removeTask).toHaveBeenCalledWith('task-1');
};

beforeEach(configureTestBed);

describe('TaskService', () => {
  it('should be created and expose empty initial state', shouldCreateService);
});

describe('getTasks', () => {
  it('should load tasks, map them, and update state', shouldLoadTasks);
  it('should expose loading failures', shouldExposeTaskLoadError);
});

describe('getTaskById', () => {
  it('should load and select a task', shouldLoadTaskById);
  it('should clear selection when the task is missing', shouldClearMissingTaskSelection);
});

describe('createTask', () => {
  it('should create, map, and select a task', shouldCreateTask);
  it('should expose creation failures', shouldExposeTaskCreationError);
});

describe('task workflows', () => {
  it('should delegate task creation with relations', shouldDelegateTaskCreationWorkflow);
  it('should expose task creation workflow failures', shouldExposeTaskCreationWorkflowError);
  it('should delegate task updates with relations', shouldDelegateTaskUpdateWorkflow);
  it('should expose task update workflow failures', shouldExposeTaskUpdateWorkflowError);
});

describe('task updates', () => {
  it('should update a task and synchronize state', shouldUpdateTask);
  it('should persist task positions and synchronize state', shouldSaveTaskPositions);
});

describe('deleteTask', () => {
  it('should delete a task and remove it from state', shouldDeleteTask);
});