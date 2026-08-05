import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Contact } from '../models/contact.model';
import { TaskRepository } from '../repositories/task.repository';
import { TaskRelationsService } from './task-relations.service';

const REPOSITORY_METHODS = [
  'getAssignedContacts',
  'createTaskAssignments',
  'createTaskAssignment',
  'deleteTaskAssignment',
  'getAssignedContactIds',
  'deleteTaskAssignments',
] as const;

/** Names of repository methods used by the assignment tests. */
type RepositoryMethod = (typeof REPOSITORY_METHODS)[number];

/** Mocked repository surface used by the assignment tests. */
type TaskRepositoryMock = Record<RepositoryMethod, ReturnType<typeof vi.fn>>;

const createContact = (id: string, firstName: string): Contact => ({
  id,
  firstName,
  lastName: 'Doe',
  email: `${firstName.toLowerCase()}@example.com`,
  phone: null,
  badgeColor: '#2a3647',
  authUserId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const MOCK_CONTACTS = [
  createContact('c1', 'John'),
  createContact('c2', 'Jane'),
  createContact('c3', 'Bob'),
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

const shouldGetAssignedContacts = async (): Promise<void> => {
  repository.getAssignedContacts.mockResolvedValue(MOCK_CONTACTS.slice(0, 2));
  const result = await service.getAssignedContacts('task-1');
  expect(repository.getAssignedContacts).toHaveBeenCalledWith('task-1');
  expect(result).toEqual(MOCK_CONTACTS.slice(0, 2));
};

const shouldCreateUniqueAssignments = async (): Promise<void> => {
  repository.createTaskAssignments.mockResolvedValue(undefined);
  await service.createAssignments('task-1', ['c1', 'c2', 'c1']);
  expect(repository.createTaskAssignments).toHaveBeenCalledWith('task-1', ['c1', 'c2']);
};

const shouldCreateEmptyAssignments = async (): Promise<void> => {
  repository.createTaskAssignments.mockResolvedValue(undefined);
  await service.createAssignments('task-1', []);
  expect(repository.createTaskAssignments).toHaveBeenCalledWith('task-1', []);
};

const shouldAssignContact = async (): Promise<void> => {
  repository.createTaskAssignment.mockResolvedValue(undefined);
  repository.getAssignedContacts.mockResolvedValue([MOCK_CONTACTS[0]]);
  const result = await service.assignContact('task-1', 'c1');
  expect(repository.createTaskAssignment).toHaveBeenCalledWith('task-1', 'c1');
  expect(result).toEqual([MOCK_CONTACTS[0]]);
};

const shouldPropagateAssignmentError = async (): Promise<void> => {
  repository.createTaskAssignment.mockRejectedValue(new Error('Constraint failed'));
  await expect(service.assignContact('task-1', 'c1')).rejects.toThrow('Constraint failed');
};

const shouldRemoveContact = async (): Promise<void> => {
  repository.deleteTaskAssignment.mockResolvedValue(undefined);
  repository.getAssignedContacts.mockResolvedValue([]);
  const result = await service.removeContact('task-1', 'c1');
  expect(repository.deleteTaskAssignment).toHaveBeenCalledWith('task-1', 'c1');
  expect(result).toEqual([]);
};

const shouldReplaceAssignments = async (): Promise<void> => {
  repository.getAssignedContactIds.mockResolvedValue(['c1', 'c2']);
  repository.getAssignedContacts.mockResolvedValue([MOCK_CONTACTS[1], MOCK_CONTACTS[2]]);
  await service.replaceAssignments('task-1', ['c2', 'c3', 'c3']);
  expect(repository.deleteTaskAssignments).toHaveBeenCalledWith('task-1', ['c1']);
  expect(repository.createTaskAssignments).toHaveBeenCalledWith('task-1', ['c3']);
};

const shouldClearAssignments = async (): Promise<void> => {
  repository.getAssignedContactIds.mockResolvedValue(['c1', 'c2']);
  repository.getAssignedContacts.mockResolvedValue([]);
  await service.replaceAssignments('task-1', []);
  expect(repository.deleteTaskAssignments).toHaveBeenCalledWith('task-1', ['c1', 'c2']);
  expect(repository.createTaskAssignments).toHaveBeenCalledWith('task-1', []);
};

const shouldKeepIdenticalAssignments = async (): Promise<void> => {
  repository.getAssignedContactIds.mockResolvedValue(['c1', 'c2']);
  repository.getAssignedContacts.mockResolvedValue(MOCK_CONTACTS.slice(0, 2));
  await service.replaceAssignments('task-1', ['c2', 'c1']);
  expect(repository.deleteTaskAssignments).toHaveBeenCalledWith('task-1', []);
  expect(repository.createTaskAssignments).toHaveBeenCalledWith('task-1', []);
};

const shouldIgnoreUndefinedOptionalAssignments = async (): Promise<void> => {
  const result = await service.updateOptionalAssignments('task-1', undefined);
  expect(result).toBeUndefined();
  expect(repository.getAssignedContactIds).not.toHaveBeenCalled();
};

const shouldClearOptionalAssignments = async (): Promise<void> => {
  repository.getAssignedContactIds.mockResolvedValue(['c1']);
  repository.getAssignedContacts.mockResolvedValue([]);
  await service.updateOptionalAssignments('task-1', []);
  expect(repository.deleteTaskAssignments).toHaveBeenCalledWith('task-1', ['c1']);
};

const shouldUpdateOptionalAssignments = async (): Promise<void> => {
  repository.getAssignedContactIds.mockResolvedValue([]);
  repository.getAssignedContacts.mockResolvedValue([MOCK_CONTACTS[0]]);
  await service.updateOptionalAssignments('task-1', ['c1']);
  expect(repository.createTaskAssignments).toHaveBeenCalledWith('task-1', ['c1']);
};

beforeEach(configureTestBed);

describe('getAssignedContacts', () => {
  it('should return assigned contacts for a task', shouldGetAssignedContacts);
});

describe('createAssignments', () => {
  it('should remove duplicate contact identifiers', shouldCreateUniqueAssignments);
  it('should accept an empty assignment input', shouldCreateEmptyAssignments);
});

describe('assignContact', () => {
  it('should assign a contact and return the refreshed list', shouldAssignContact);
  it('should propagate repository errors', shouldPropagateAssignmentError);
});

describe('removeContact', () => {
  it('should remove a contact and return the refreshed list', shouldRemoveContact);
});

describe('replaceAssignments', () => {
  it('should add and remove assignment differences', shouldReplaceAssignments);
  it('should delete every assignment for an empty input', shouldClearAssignments);
  it('should persist no changes for identical state', shouldKeepIdenticalAssignments);
});

describe('updateOptionalAssignments', () => {
  it('should ignore an undefined input', shouldIgnoreUndefinedOptionalAssignments);
  it('should clear assignments for an empty input', shouldClearOptionalAssignments);
  it('should synchronize a defined input', shouldUpdateOptionalAssignments);
});