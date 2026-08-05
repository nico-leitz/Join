import { beforeEach, describe, expect, it } from 'vitest';
import { BoardRelationsData } from '../models/task-relations.model';
import {
  MOCK_CONTACTS,
  MOCK_SUBTASKS,
  TaskServiceHarness,
  createTaskServiceHarness,
} from './task-service-test.utils';

let harness: TaskServiceHarness;

const configureTestBed = (): void => {
  harness = createTaskServiceHarness();
};

const shouldLoadSubtasks = async (): Promise<void> => {
  harness.relations.getSubtasks.mockResolvedValue(MOCK_SUBTASKS);
  const result = await harness.service.getSubtasksByTaskId('task-1');
  expect(harness.relations.getSubtasks).toHaveBeenCalledWith('task-1');
  expect(harness.state.setSubtasksForTask).toHaveBeenCalledWith('task-1', MOCK_SUBTASKS);
  expect(result).toEqual(MOCK_SUBTASKS);
};

const shouldLoadAssignedContacts = async (): Promise<void> => {
  harness.relations.getAssignedContacts.mockResolvedValue(MOCK_CONTACTS);
  const result = await harness.service.getAssignedContacts('task-1');
  expect(harness.relations.getAssignedContacts).toHaveBeenCalledWith('task-1');
  expect(harness.state.setContactsForTask).toHaveBeenCalledWith('task-1', MOCK_CONTACTS);
  expect(result).toEqual(MOCK_CONTACTS);
};

const shouldLoadBoardRelations = async (): Promise<void> => {
  const data: BoardRelationsData = { subtasks: MOCK_SUBTASKS, assignments: [] };
  harness.relations.loadBoardRelations.mockResolvedValue(data);
  await expect(harness.service.loadAllBoardData()).resolves.toEqual(data);
  expect(harness.relations.loadBoardRelations).toHaveBeenCalled();
};

const shouldReplaceTaskSubtasks = async (): Promise<void> => {
  const inputs = [{ title: 'Replaced Sub' }];
  harness.relations.replaceSubtasks.mockResolvedValue(MOCK_SUBTASKS);
  const result = await harness.service.replaceTaskSubtasks('task-1', inputs);
  expect(harness.relations.replaceSubtasks).toHaveBeenCalledWith('task-1', inputs);
  expect(harness.state.setSubtasksForTask).toHaveBeenCalledWith('task-1', MOCK_SUBTASKS);
  expect(result).toEqual(MOCK_SUBTASKS);
};

const shouldCreateSubtask = async (): Promise<void> => {
  const input = { taskId: 'task-1', title: 'New Sub' };
  harness.relations.createSubtask.mockResolvedValue(MOCK_SUBTASKS[0]);
  const result = await harness.service.createSubtask(input);
  expect(harness.relations.createSubtask).toHaveBeenCalledWith(input);
  expect(harness.state.addSubtask).toHaveBeenCalledWith(MOCK_SUBTASKS[0]);
  expect(result).toEqual(MOCK_SUBTASKS[0]);
};

const shouldUpdateSubtask = async (): Promise<void> => {
  const update = { title: 'Updated' };
  harness.relations.updateSubtask.mockResolvedValue(MOCK_SUBTASKS[0]);
  const result = await harness.service.updateSubtask('sub-1', update);
  expect(harness.relations.updateSubtask).toHaveBeenCalledWith('sub-1', update);
  expect(harness.state.updateSubtask).toHaveBeenCalledWith(MOCK_SUBTASKS[0]);
  expect(result).toEqual(MOCK_SUBTASKS[0]);
};

const shouldToggleSubtask = async (): Promise<void> => {
  harness.relations.updateSubtask.mockResolvedValue(MOCK_SUBTASKS[0]);
  await harness.service.toggleSubtaskCompletion('sub-1', true);
  expect(harness.relations.updateSubtask).toHaveBeenCalledWith('sub-1', {
    isCompleted: true,
  });
};

const shouldDeleteSubtask = async (): Promise<void> => {
  harness.relations.deleteSubtask.mockResolvedValue(undefined);
  await harness.service.deleteSubtask('sub-1');
  expect(harness.relations.deleteSubtask).toHaveBeenCalledWith('sub-1');
  expect(harness.state.removeSubtask).toHaveBeenCalledWith('sub-1');
};

const shouldAssignContact = async (): Promise<void> => {
  harness.relations.assignContact.mockResolvedValue(MOCK_CONTACTS);
  const result = await harness.service.assignContact('task-1', 'contact-1');
  expect(harness.relations.assignContact).toHaveBeenCalledWith('task-1', 'contact-1');
  expect(harness.state.setContactsForTask).toHaveBeenCalledWith('task-1', MOCK_CONTACTS);
  expect(result).toEqual(MOCK_CONTACTS);
};

const shouldRemoveContact = async (): Promise<void> => {
  harness.relations.removeContact.mockResolvedValue([]);
  const result = await harness.service.removeContactAssignment('task-1', 'contact-1');
  expect(harness.relations.removeContact).toHaveBeenCalledWith('task-1', 'contact-1');
  expect(harness.state.setContactsForTask).toHaveBeenCalledWith('task-1', []);
  expect(result).toEqual([]);
};

const shouldReplaceAssignments = async (): Promise<void> => {
  harness.relations.replaceAssignments.mockResolvedValue(MOCK_CONTACTS);
  const result = await harness.service.replaceTaskAssignments('task-1', ['contact-1']);
  expect(harness.relations.replaceAssignments).toHaveBeenCalledWith('task-1', ['contact-1']);
  expect(harness.state.setContactsForTask).toHaveBeenCalledWith('task-1', MOCK_CONTACTS);
  expect(result).toEqual(MOCK_CONTACTS);
};

beforeEach(configureTestBed);

describe('task relation loading', () => {
  it('should load subtasks and synchronize state', shouldLoadSubtasks);
  it('should load assigned contacts and synchronize state', shouldLoadAssignedContacts);
  it('should delegate board relation loading', shouldLoadBoardRelations);
});

describe('task subtask facade', () => {
  it('should replace all task subtasks', shouldReplaceTaskSubtasks);
  it('should create a subtask', shouldCreateSubtask);
  it('should update a subtask', shouldUpdateSubtask);
  it('should toggle subtask completion', shouldToggleSubtask);
  it('should delete a subtask', shouldDeleteSubtask);
});

describe('task assignment facade', () => {
  it('should assign a contact', shouldAssignContact);
  it('should remove a contact assignment', shouldRemoveContact);
  it('should replace task assignments', shouldReplaceAssignments);
});