import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSubtask, SubtaskRow, UpdateSubtask } from '../models/subtask.model';
import { TaskAssignmentRow } from '../models/task-assignment.model';
import { UpdateTaskSubtaskInput } from '../models/task-persistence.model';
import { TaskRepository } from '../repositories/task.repository';
import { TaskRelationsService } from './task-relations.service';

const REPOSITORY_METHODS = [
  'getAllSubtaskRows',
  'getAllAssignmentRows',
  'getSubtaskRows',
  'createSubtask',
  'updateSubtask',
  'deleteSubtask',
  'updateTaskSubtask',
  'deleteTaskSubtasks',
] as const;

/** Names of repository methods used by the subtask tests. */
type RepositoryMethod = (typeof REPOSITORY_METHODS)[number];

/** Mocked repository surface used by the subtask tests. */
type TaskRepositoryMock = Record<RepositoryMethod, ReturnType<typeof vi.fn>>;

const SUBTASK_ROW_BASE = {
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const createSubtaskRow = (
  id: string,
  taskId: string,
  title: string,
  sortOrder: number,
  isCompleted = false,
): SubtaskRow => ({
  ...SUBTASK_ROW_BASE,
  id,
  task_id: taskId,
  title,
  sort_order: sortOrder,
  is_completed: isCompleted,
});

const MOCK_SUBTASK_ROWS = [
  createSubtaskRow('sub-1', 'task-1', 'Test 1', 0),
  createSubtaskRow('sub-2', 'task-1', 'Test 2', 1, true),
  createSubtaskRow('sub-3', 'task-2', 'Test 3', 0),
];

const MOCK_ASSIGNMENT_ROWS: TaskAssignmentRow[] = [
  { task_id: 'task-1', contact_id: 'c1', created_at: '2026-01-01T00:00:00.000Z' },
  { task_id: 'task-1', contact_id: 'c2', created_at: '2026-01-01T00:00:00.000Z' },
];

const CURRENT_REPLACEMENT_ROWS = [
  createSubtaskRow('existing-1', 'task-1', 'Existing', 0),
  createSubtaskRow('to-delete', 'task-1', 'Delete', 1),
];

const PERSISTED_REPLACEMENT_ROWS = [
  createSubtaskRow('existing-1', 'task-1', 'Updated Title', 0, true),
  createSubtaskRow('new-2', 'task-1', 'New Subtask', 1),
];

const REPLACEMENT_INPUTS: UpdateTaskSubtaskInput[] = [
  { id: 'existing-1', title: 'Updated Title', isCompleted: true },
  { title: 'New Subtask' },
];

let service: TaskRelationsService;
let repository: TaskRepositoryMock;

const createRepositoryMock = (): TaskRepositoryMock => {
  return Object.fromEntries(
    REPOSITORY_METHODS.map((method) => [method, vi.fn()]),
  ) as TaskRepositoryMock;
};

const configureTestBed = (): void => {
  repository = createRepositoryMock();
  TestBed.configureTestingModule({
    providers: [TaskRelationsService, { provide: TaskRepository, useValue: repository }],
  });
  service = TestBed.inject(TaskRelationsService);
};

const shouldCreateService = (): void => {
  expect(service).toBeTruthy();
};

const shouldLoadBoardRelations = async (): Promise<void> => {
  repository.getAllSubtaskRows.mockResolvedValue(MOCK_SUBTASK_ROWS);
  repository.getAllAssignmentRows.mockResolvedValue(MOCK_ASSIGNMENT_ROWS);
  const result = await service.loadBoardRelations();
  expect(repository.getAllSubtaskRows).toHaveBeenCalled();
  expect(repository.getAllAssignmentRows).toHaveBeenCalled();
  expect(result.subtasks).toHaveLength(3);
  expect(result.subtasks[0]).toMatchObject({ id: 'sub-1', taskId: 'task-1' });
  expect(result.assignments).toEqual(MOCK_ASSIGNMENT_ROWS);
};

const shouldLoadEmptyBoardRelations = async (): Promise<void> => {
  repository.getAllSubtaskRows.mockResolvedValue([]);
  repository.getAllAssignmentRows.mockResolvedValue([]);
  const result = await service.loadBoardRelations();
  expect(result).toEqual({ subtasks: [], assignments: [] });
};

const shouldPropagateBoardLoadError = async (): Promise<void> => {
  repository.getAllSubtaskRows.mockRejectedValue(new Error('DB Connection Error'));
  repository.getAllAssignmentRows.mockResolvedValue([]);
  await expect(service.loadBoardRelations()).rejects.toThrow('DB Connection Error');
};

const shouldGetMappedSubtasks = async (): Promise<void> => {
  repository.getSubtaskRows.mockResolvedValue(MOCK_SUBTASK_ROWS.slice(0, 2));
  const result = await service.getSubtasks('task-1');
  expect(repository.getSubtaskRows).toHaveBeenCalledWith('task-1');
  expect(result).toHaveLength(2);
  expect(result[1]).toMatchObject({ id: 'sub-2', isCompleted: true });
};

const shouldReturnNoSubtasks = async (): Promise<void> => {
  repository.getSubtaskRows.mockResolvedValue([]);
  await expect(service.getSubtasks('unknown-task')).resolves.toEqual([]);
};

const shouldCreateMappedSubtask = async (): Promise<void> => {
  const input: CreateSubtask = { taskId: 'task-1', title: 'New Subtask', sortOrder: 5 };
  const row = createSubtaskRow('new-sub', 'task-1', 'New Subtask', 5);
  repository.createSubtask.mockResolvedValue(row);
  const result = await service.createSubtask(input);
  expect(repository.createSubtask).toHaveBeenCalledWith(input);
  expect(result).toMatchObject({ id: 'new-sub', title: 'New Subtask', sortOrder: 5 });
};

const shouldUpdateMappedSubtask = async (): Promise<void> => {
  const update: UpdateSubtask = { title: 'Updated Title', sortOrder: 2, isCompleted: true };
  repository.updateSubtask.mockResolvedValue(
    createSubtaskRow('sub-1', 'task-1', 'Updated Title', 2, true),
  );
  const result = await service.updateSubtask('sub-1', update);
  expect(repository.updateSubtask).toHaveBeenCalledWith('sub-1', update);
  expect(result).toMatchObject({ title: 'Updated Title', isCompleted: true });
};

const shouldAllowPartialSubtaskUpdate = async (): Promise<void> => {
  const update: UpdateSubtask = { title: 'Only Title Update' };
  const row = { ...MOCK_SUBTASK_ROWS[0], title: 'Only Title Update' };
  repository.updateSubtask.mockResolvedValue(row);
  const result = await service.updateSubtask('sub-1', update);
  expect(repository.updateSubtask).toHaveBeenCalledWith('sub-1', update);
  expect(result).toMatchObject({ title: 'Only Title Update', isCompleted: false });
};

const shouldDeleteSubtask = async (): Promise<void> => {
  repository.deleteSubtask.mockResolvedValue(undefined);
  await service.deleteSubtask('sub-1');
  expect(repository.deleteSubtask).toHaveBeenCalledWith('sub-1');
};

const shouldPropagateDeleteError = async (): Promise<void> => {
  repository.deleteSubtask.mockRejectedValue(new Error('Delete Failed'));
  await expect(service.deleteSubtask('sub-1')).rejects.toThrow('Delete Failed');
};

const shouldCreateSortedSubtasks = async (): Promise<void> => {
  const first = { taskId: 'task-1', title: 'Test 2', sortOrder: 1 };
  const second = { taskId: 'task-1', title: 'Test 1', sortOrder: 0 };
  repository.createSubtask
    .mockResolvedValueOnce(MOCK_SUBTASK_ROWS[1])
    .mockResolvedValueOnce(MOCK_SUBTASK_ROWS[0]);
  const result = await service.createSubtasksForTask('task-1', [first, second]);
  expect(repository.createSubtask).toHaveBeenNthCalledWith(1, first);
  expect(repository.createSubtask).toHaveBeenNthCalledWith(2, second);
  expect(result.map((subtask) => subtask.title)).toEqual(['Test 1', 'Test 2']);
};

const shouldSkipEmptySubtaskCreation = async (): Promise<void> => {
  const result = await service.createSubtasksForTask('task-1', []);
  expect(repository.createSubtask).not.toHaveBeenCalled();
  expect(result).toEqual([]);
};

const shouldRejectDuplicateSubtaskIds = async (): Promise<void> => {
  const inputs: UpdateTaskSubtaskInput[] = [
    { id: 'dup-1', title: 'Test 1' },
    { id: 'dup-1', title: 'Test 2' },
  ];
  repository.getSubtaskRows.mockResolvedValue([]);
  await expect(service.replaceSubtasks('task-1', inputs)).rejects.toThrow(
    'Duplicate subtask IDs are not allowed.',
  );
};

const shouldRejectForeignSubtask = async (): Promise<void> => {
  const inputs: UpdateTaskSubtaskInput[] = [{ id: 'invalid-1', title: 'Wrong Task Subtask' }];
  repository.getSubtaskRows.mockResolvedValue([MOCK_SUBTASK_ROWS[0]]);
  await expect(service.replaceSubtasks('task-1', inputs)).rejects.toThrow(
    'Subtask does not belong to this task.',
  );
};

const expectSubtaskReplacement = (): void => {
  expect(repository.updateTaskSubtask).toHaveBeenCalledWith(
    'task-1',
    'existing-1',
    expect.objectContaining({ title: 'Updated Title', isCompleted: true, sortOrder: 0 }),
  );
  expect(repository.createSubtask).toHaveBeenCalledWith(
    expect.objectContaining({ taskId: 'task-1', title: 'New Subtask', sortOrder: 1 }),
  );
  expect(repository.deleteTaskSubtasks).toHaveBeenCalledWith('task-1', ['to-delete']);
};

const shouldReplaceSubtasks = async (): Promise<void> => {
  repository.getSubtaskRows
    .mockResolvedValueOnce(CURRENT_REPLACEMENT_ROWS)
    .mockResolvedValueOnce(PERSISTED_REPLACEMENT_ROWS);
  await service.replaceSubtasks('task-1', REPLACEMENT_INPUTS);
  expectSubtaskReplacement();
};

const shouldDeleteAllSubtasks = async (): Promise<void> => {
  repository.getSubtaskRows
    .mockResolvedValueOnce(MOCK_SUBTASK_ROWS.slice(0, 2))
    .mockResolvedValueOnce([]);
  await service.replaceSubtasks('task-1', []);
  expect(repository.updateTaskSubtask).not.toHaveBeenCalled();
  expect(repository.createSubtask).not.toHaveBeenCalled();
  expect(repository.deleteTaskSubtasks).toHaveBeenCalledWith('task-1', ['sub-1', 'sub-2']);
};

const shouldIgnoreUndefinedOptionalSubtasks = async (): Promise<void> => {
  const result = await service.updateOptionalSubtasks('task-1', undefined);
  expect(result).toBeUndefined();
  expect(repository.getSubtaskRows).not.toHaveBeenCalled();
};

const shouldClearOptionalSubtasks = async (): Promise<void> => {
  repository.getSubtaskRows.mockResolvedValueOnce([MOCK_SUBTASK_ROWS[0]]).mockResolvedValueOnce([]);
  await service.updateOptionalSubtasks('task-1', []);
  expect(repository.deleteTaskSubtasks).toHaveBeenCalledWith('task-1', ['sub-1']);
};

const shouldUpdateOptionalSubtasks = async (): Promise<void> => {
  const inputs: UpdateTaskSubtaskInput[] = [{ title: 'New Optional' }];
  repository.getSubtaskRows.mockResolvedValueOnce([]).mockResolvedValueOnce([MOCK_SUBTASK_ROWS[0]]);
  await service.updateOptionalSubtasks('task-1', inputs);
  expect(repository.createSubtask).toHaveBeenCalled();
};

beforeEach(configureTestBed);

describe('TaskRelationsService', () => {
  it('should be created', shouldCreateService);
});

describe('loadBoardRelations', () => {
  it('should retrieve and map all board relations', shouldLoadBoardRelations);
  it('should handle empty database responses', shouldLoadEmptyBoardRelations);
  it('should propagate repository errors', shouldPropagateBoardLoadError);
});

describe('getSubtasks', () => {
  it('should retrieve and map subtasks by task id', shouldGetMappedSubtasks);
  it('should return an empty array when no subtasks exist', shouldReturnNoSubtasks);
});

describe('createSubtask', () => {
  it('should create and map a new subtask', shouldCreateMappedSubtask);
});

describe('updateSubtask', () => {
  it('should update and map an existing subtask', shouldUpdateMappedSubtask);
  it('should preserve fields during a partial update', shouldAllowPartialSubtaskUpdate);
});

describe('deleteSubtask', () => {
  it('should delegate deletion to the repository', shouldDeleteSubtask);
  it('should propagate repository errors', shouldPropagateDeleteError);
});

describe('createSubtasksForTask', () => {
  it('should create and sort multiple subtasks', shouldCreateSortedSubtasks);
  it('should skip creation for an empty input', shouldSkipEmptySubtaskCreation);
});

describe('replaceSubtasks', () => {
  it('should reject duplicate identifiers', shouldRejectDuplicateSubtaskIds);
  it('should reject foreign subtasks', shouldRejectForeignSubtask);
  it('should synchronize created, updated, and removed subtasks', shouldReplaceSubtasks);
  it('should delete every subtask for an empty input', shouldDeleteAllSubtasks);
});

describe('updateOptionalSubtasks', () => {
  it('should ignore an undefined input', shouldIgnoreUndefinedOptionalSubtasks);
  it('should clear subtasks for an empty input', shouldClearOptionalSubtasks);
  it('should synchronize a defined input', shouldUpdateOptionalSubtasks);
});