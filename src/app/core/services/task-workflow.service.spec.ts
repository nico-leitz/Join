import { beforeEach, describe, expect, it } from 'vitest';
import {
  CreateTaskWithRelationsInput,
  UpdateTaskWithRelationsInput,
} from '../models/task-persistence.model';
import {
  MOCK_CONTACTS,
  MOCK_SUBTASKS,
  MOCK_TASK_ROWS,
  MOCK_TASKS,
  TaskWorkflowHarness,
  VALID_CREATE_TASK,
  createTaskWorkflowHarness,
} from './task-service-test.utils';

let harness: TaskWorkflowHarness;

const configureTestBed = (): void => {
  harness = createTaskWorkflowHarness();
};

const createInput = (): CreateTaskWithRelationsInput => ({
  task: VALID_CREATE_TASK,
  subtasks: [{ title: 'Sub 1' }],
  contactIds: ['contact-1'],
});

const prepareSuccessfulCreation = (): void => {
  harness.repository.createTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
  harness.relations.createSubtasksForTask.mockResolvedValue(MOCK_SUBTASKS);
  harness.relations.createAssignments.mockResolvedValue(undefined);
  harness.relations.getAssignedContacts.mockResolvedValue(MOCK_CONTACTS);
};

const shouldCreateTaskWithRelations = async (): Promise<void> => {
  const input = createInput();
  prepareSuccessfulCreation();
  const result = await harness.service.createTaskWithRelations(input);
  expect(harness.repository.createTask).toHaveBeenCalledWith(input.task);
  expect(harness.relations.createSubtasksForTask).toHaveBeenCalledWith('task-1', input.subtasks);
  expect(harness.relations.createAssignments).toHaveBeenCalledWith('task-1', input.contactIds);
  expect(harness.state.applyCreatedTask).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'task-1' }),
    MOCK_SUBTASKS,
    MOCK_CONTACTS,
  );
  expect(result.id).toBe('task-1');
};

const shouldRollbackFailedCreation = async (): Promise<void> => {
  const input = createInput();
  harness.repository.createTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
  harness.relations.createSubtasksForTask.mockRejectedValue(new Error('Subtask Error'));
  harness.repository.deleteTask.mockResolvedValue(undefined);
  await expect(harness.service.createTaskWithRelations(input)).rejects.toThrow('Subtask Error');
  expect(harness.repository.deleteTask).toHaveBeenCalledWith('task-1');
};

const shouldPreserveCreationError = async (): Promise<void> => {
  const input = createInput();
  harness.repository.createTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
  harness.relations.createSubtasksForTask.mockRejectedValue(new Error('Subtask Error'));
  harness.repository.deleteTask.mockRejectedValue(new Error('Rollback Error'));
  await expect(harness.service.createTaskWithRelations(input)).rejects.toThrow('Subtask Error');
};

const prepareSuccessfulUpdate = (): UpdateTaskWithRelationsInput => {
  const input = { task: { title: 'Updated Task' }, subtasks: [{ title: 'New Sub' }] };
  harness.repository.updateTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
  harness.relations.updateOptionalSubtasks.mockResolvedValue(MOCK_SUBTASKS);
  harness.relations.updateOptionalAssignments.mockResolvedValue(undefined);
  return input;
};

const shouldUpdateTaskWithRelations = async (): Promise<void> => {
  const input = prepareSuccessfulUpdate();
  const result = await harness.service.updateTaskWithRelations('task-1', input);
  expect(harness.repository.updateTask).toHaveBeenCalledWith('task-1', input.task);
  expect(harness.relations.updateOptionalSubtasks).toHaveBeenCalledWith('task-1', input.subtasks);
  expect(harness.relations.updateOptionalAssignments).toHaveBeenCalledWith('task-1', undefined);
  expect(harness.state.applyUpdatedTask).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'task-1' }),
    MOCK_SUBTASKS,
    undefined,
  );
  expect(result.id).toBe('task-1');
};

const expectSelectedStateRefresh = (): void => {
  expect(harness.state.updateTask).toHaveBeenCalled();
  expect(harness.state.setSelectedSubtasks).toHaveBeenCalledWith([]);
  expect(harness.state.setAssignedContacts).toHaveBeenCalledWith([]);
};

const shouldRefreshSelectedStateAfterFailure = async (): Promise<void> => {
  const input: UpdateTaskWithRelationsInput = { task: {}, subtasks: [] };
  harness.repository.updateTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
  harness.relations.updateOptionalSubtasks.mockRejectedValue(new Error('Update Failed'));
  harness.repository.getTaskRowById.mockResolvedValue(MOCK_TASK_ROWS[0]);
  harness.repository.getSubtaskRows.mockResolvedValue([]);
  harness.repository.getAssignedContacts.mockResolvedValue([]);
  harness.state.selectedTask.set(MOCK_TASKS[0]);
  await expect(harness.service.updateTaskWithRelations('task-1', input)).rejects.toThrow(
    'Update Failed',
  );
  expectSelectedStateRefresh();
};

const shouldIgnoreMissingTaskDuringRefresh = async (): Promise<void> => {
  const input: UpdateTaskWithRelationsInput = { task: {} };
  harness.repository.updateTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
  harness.relations.updateOptionalSubtasks.mockRejectedValue(new Error('Failed'));
  harness.repository.getTaskRowById.mockResolvedValue(null);
  await expect(harness.service.updateTaskWithRelations('task-1', input)).rejects.toThrow('Failed');
  expect(harness.state.updateTask).not.toHaveBeenCalled();
};

beforeEach(configureTestBed);

describe('createTaskWithRelations', () => {
  it('should persist task relations and synchronize state', shouldCreateTaskWithRelations);
  it('should rollback a task after relation failure', shouldRollbackFailedCreation);
  it('should preserve the root error when rollback fails', shouldPreserveCreationError);
});

describe('updateTaskWithRelations', () => {
  it('should persist optional relations and synchronize state', shouldUpdateTaskWithRelations);
  it(
    'should refresh selected state after a partial failure',
    shouldRefreshSelectedStateAfterFailure,
  );
  it('should ignore a missing task during recovery', shouldIgnoreMissingTaskDuringRefresh);
});