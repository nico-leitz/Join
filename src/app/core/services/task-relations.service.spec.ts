/**
 * @fileoverview Exhaustive unit tests for the TaskRelationsService.
 * Validates relation fetching, subtask synchronization, contact assignment logic,
 * error handling, and edge cases.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskRelationsService } from './task-relations.service';
import { TaskRepository } from '../repositories/task.repository';
import { CreateTaskSubtaskInput, UpdateTaskSubtaskInput } from '../models/task-persistence.model';
import { CreateSubtask, UpdateSubtask } from '../models/subtask.model';

/**
 * @constant MOCK_SUBTASK_ROWS
 * @description Mock data representing raw subtask database responses in snake_case.
 */
const MOCK_SUBTASK_ROWS = [
  { id: 'sub-1', task_id: 'task-1', title: 'Test 1', sort_order: 0, is_completed: false },
  { id: 'sub-2', task_id: 'task-1', title: 'Test 2', sort_order: 1, is_completed: true },
  { id: 'sub-3', task_id: 'task-2', title: 'Test 3', sort_order: 0, is_completed: false }
];

/**
 * @constant MOCK_ASSIGNMENT_ROWS
 * @description Mock data representing raw task assignments database responses in snake_case.
 */
const MOCK_ASSIGNMENT_ROWS = [
  { task_id: 'task-1', contact_id: 'c1' },
  { task_id: 'task-1', contact_id: 'c2' }
];

/**
 * @constant MOCK_CONTACTS
 * @description Mock data representing application contact state in camelCase.
 */
const MOCK_CONTACTS = [
  { id: 'c1', name: 'John Doe', email: 'john@example.com' },
  { id: 'c2', name: 'Jane Doe', email: 'jane@example.com' },
  { id: 'c3', name: 'Bob Smith', email: 'bob@example.com' }
];

/**
 * @description Test suite for the TaskRelationsService.
 */
describe('TaskRelationsService', () => {
  let service: TaskRelationsService;
  let mockRepository: any;

  /**
   * @description Sets up the test environment, mocking the TaskRepository using vitest.
   */
  beforeEach(() => {
    mockRepository = {
      getAllSubtaskRows: vi.fn(),
      getAllAssignmentRows: vi.fn(),
      getSubtaskRows: vi.fn(),
      getAssignedContacts: vi.fn(),
      createSubtask: vi.fn(),
      updateSubtask: vi.fn(),
      deleteSubtask: vi.fn(),
      createTaskAssignments: vi.fn(),
      createTaskAssignment: vi.fn(),
      deleteTaskAssignment: vi.fn(),
      updateTaskSubtask: vi.fn(),
      deleteTaskSubtasks: vi.fn(),
      getAssignedContactIds: vi.fn(),
      deleteTaskAssignments: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskRelationsService,
        { provide: TaskRepository, useValue: mockRepository },
      ],
    });

    service = TestBed.inject(TaskRelationsService);
  });

  /**
   * @test Verifies dependency injection and service instantiation.
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadBoardRelations', () => {
    /**
     * @test Ensures board relations are loaded and mapped correctly under normal conditions.
     */
    it('should retrieve all board relations and map subtasks correctly', async () => {
      mockRepository.getAllSubtaskRows.mockResolvedValue(MOCK_SUBTASK_ROWS);
      mockRepository.getAllAssignmentRows.mockResolvedValue(MOCK_ASSIGNMENT_ROWS);

      const result = await service.loadBoardRelations();

      expect(mockRepository.getAllSubtaskRows).toHaveBeenCalled();
      expect(mockRepository.getAllAssignmentRows).toHaveBeenCalled();
      expect(result.subtasks.length).toBe(3);
      expect(result.subtasks[0].id).toBe('sub-1');
      expect(result.subtasks[0].taskId).toBe('task-1');
      expect(result.assignments).toEqual(MOCK_ASSIGNMENT_ROWS);
    });

    /**
     * @test Validates behavior when database returns empty arrays.
     */
    it('should handle empty database responses gracefully', async () => {
      mockRepository.getAllSubtaskRows.mockResolvedValue([]);
      mockRepository.getAllAssignmentRows.mockResolvedValue([]);

      const result = await service.loadBoardRelations();

      expect(result.subtasks).toEqual([]);
      expect(result.assignments).toEqual([]);
    });

    /**
     * @test Ensures repository errors bubble up to the caller.
     */
    it('should throw an error if getAllSubtaskRows fails', async () => {
      mockRepository.getAllSubtaskRows.mockRejectedValue(new Error('DB Connection Error'));
      mockRepository.getAllAssignmentRows.mockResolvedValue([]);

      await expect(service.loadBoardRelations()).rejects.toThrow('DB Connection Error');
    });
  });

  describe('getSubtasks', () => {
    /**
     * @test Validates retrieval and mapping of subtasks by task id.
     */
    it('should retrieve and map subtasks by task id', async () => {
      mockRepository.getSubtaskRows.mockResolvedValue([MOCK_SUBTASK_ROWS[0], MOCK_SUBTASK_ROWS[1]]);

      const result = await service.getSubtasks('task-1');

      expect(mockRepository.getSubtaskRows).toHaveBeenCalledWith('task-1');
      expect(result.length).toBe(2);
      expect(result[1].id).toBe('sub-2');
      expect(result[1].isCompleted).toBe(true);
    });

    /**
     * @test Validates behavior when task has no subtasks.
     */
    it('should return an empty array if task has no subtasks', async () => {
      mockRepository.getSubtaskRows.mockResolvedValue([]);

      const result = await service.getSubtasks('unknown-task');

      expect(result).toEqual([]);
    });
  });

  describe('getAssignedContacts', () => {
    /**
     * @test Validates retrieval of assigned contacts for a task.
     */
    it('should return assigned contacts for a task', async () => {
      mockRepository.getAssignedContacts.mockResolvedValue([MOCK_CONTACTS[0], MOCK_CONTACTS[1]]);

      const result = await service.getAssignedContacts('task-1');

      expect(mockRepository.getAssignedContacts).toHaveBeenCalledWith('task-1');
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('c1');
    });
  });

  describe('createSubtask', () => {
    /**
     * @test Validates creation and mapping of a new subtask.
     */
    it('should create and map a new subtask', async () => {
      const input: CreateSubtask = { taskId: 'task-1', title: 'New Subtask', sortOrder: 5 };
      mockRepository.createSubtask.mockResolvedValue({
        id: 'new-sub',
        task_id: 'task-1',
        title: 'New Subtask',
        sort_order: 5,
        is_completed: false
      });

      const result = await service.createSubtask(input);

      expect(mockRepository.createSubtask).toHaveBeenCalledWith(input);
      expect(result.id).toBe('new-sub');
      expect(result.title).toBe('New Subtask');
      expect(result.sortOrder).toBe(5);
    });
  });

  describe('updateSubtask', () => {
    /**
     * @test Validates update and mapping of an existing subtask (full update).
     */
    it('should update and map an existing subtask', async () => {
      const updateData: UpdateSubtask = { title: 'Updated Title', sortOrder: 2, isCompleted: true };
      mockRepository.updateSubtask.mockResolvedValue({
        id: 'sub-1',
        task_id: 'task-1',
        title: 'Updated Title',
        sort_order: 2,
        is_completed: true
      });

      const result = await service.updateSubtask('sub-1', updateData);

      expect(mockRepository.updateSubtask).toHaveBeenCalledWith('sub-1', updateData);
      expect(result.title).toBe('Updated Title');
      expect(result.isCompleted).toBe(true);
    });

    /**
     * @test Validates partial update (only title).
     */
    it('should allow partial updates without overwriting unspecified fields in the mock response', async () => {
      const updateData: UpdateSubtask = { title: 'Only Title Update' };
      mockRepository.updateSubtask.mockResolvedValue({
        ...MOCK_SUBTASK_ROWS[0],
        title: 'Only Title Update'
      });

      const result = await service.updateSubtask('sub-1', updateData);

      expect(mockRepository.updateSubtask).toHaveBeenCalledWith('sub-1', updateData);
      expect(result.title).toBe('Only Title Update');
      expect(result.isCompleted).toBe(false);
    });
  });

  describe('deleteSubtask', () => {
    /**
     * @test Validates delegation of subtask deletion.
     */
    it('should delegate subtask deletion to the repository', async () => {
      mockRepository.deleteSubtask.mockResolvedValue(undefined);

      await service.deleteSubtask('sub-1');

      expect(mockRepository.deleteSubtask).toHaveBeenCalledWith('sub-1');
    });

    /**
     * @test Ensures error is thrown if repository fails to delete.
     */
    it('should throw if repository fails to delete', async () => {
      mockRepository.deleteSubtask.mockRejectedValue(new Error('Delete Failed'));

      await expect(service.deleteSubtask('sub-1')).rejects.toThrow('Delete Failed');
    });
  });

  describe('createSubtasksForTask', () => {
    /**
     * @test Validates batch creation and sorting of subtasks based on index.
     */
    it('should create multiple subtasks and return them sorted', async () => {
      const inputs: CreateTaskSubtaskInput[] = [
        { title: 'Test 2', sortOrder: 1 },
        { title: 'Test 1', sortOrder: 0 }
      ];

      mockRepository.createSubtask
        .mockResolvedValueOnce(MOCK_SUBTASK_ROWS[1])
        .mockResolvedValueOnce(MOCK_SUBTASK_ROWS[0]);

      const result = await service.createSubtasksForTask('task-1', inputs);

      expect(mockRepository.createSubtask).toHaveBeenCalledTimes(2);
      expect(mockRepository.createSubtask).toHaveBeenNthCalledWith(1, { taskId: 'task-1', title: 'Test 2', sortOrder: 1 });
      expect(mockRepository.createSubtask).toHaveBeenNthCalledWith(2, { taskId: 'task-1', title: 'Test 1', sortOrder: 0 });
      
      expect(result[0].title).toBe('Test 1');
      expect(result[1].title).toBe('Test 2');
    });

    /**
     * @test Validates behavior when input array is empty.
     */
    it('should return empty array if no subtasks are provided', async () => {
      const result = await service.createSubtasksForTask('task-1', []);
      expect(mockRepository.createSubtask).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('replaceSubtasks', () => {
    /**
     * @test Ensures error is thrown when duplicate subtask IDs are submitted.
     */
    it('should throw an error if duplicate IDs are provided during subtask replacement', async () => {
      mockRepository.getSubtaskRows.mockResolvedValue([]);
      const inputs: UpdateTaskSubtaskInput[] = [
        { id: 'dup-1', title: 'Test 1' },
        { id: 'dup-1', title: 'Test 2' }
      ];

      await expect(service.replaceSubtasks('task-1', inputs)).rejects.toThrow('Duplicate subtask IDs are not allowed.');
    });

    /**
     * @test Ensures error is thrown when a subtask does not belong to the target task.
     */
    it('should throw an error if a subtask does not belong to the task during replacement', async () => {
      mockRepository.getSubtaskRows.mockResolvedValue([{ id: 'valid-1' }]);
      const inputs: UpdateTaskSubtaskInput[] = [
        { id: 'invalid-1', title: 'Wrong Task Subtask' }
      ];

      await expect(service.replaceSubtasks('task-1', inputs)).rejects.toThrow('Subtask does not belong to this task.');
    });

    /**
     * @test Validates full synchronization: Updates existing, creates new, deletes missing.
     */
    it('should update existing, create new, and delete missing subtasks including complete status', async () => {
      mockRepository.getSubtaskRows.mockResolvedValueOnce([{ id: 'existing-1' }, { id: 'to-delete' }]);
      mockRepository.getSubtaskRows.mockResolvedValueOnce([{ id: 'existing-1' }, { id: 'new-2' }]);

      const inputs: UpdateTaskSubtaskInput[] = [
        { id: 'existing-1', title: 'Updated Title', isCompleted: true },
        { title: 'New Subtask' }
      ];

      await service.replaceSubtasks('task-1', inputs);

      expect(mockRepository.updateTaskSubtask).toHaveBeenCalledWith(
        'task-1',
        'existing-1',
        expect.objectContaining({ title: 'Updated Title', isCompleted: true, sortOrder: 0 })
      );

      expect(mockRepository.createSubtask).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: 'task-1', title: 'New Subtask', sortOrder: 1 })
      );

      expect(mockRepository.deleteTaskSubtasks).toHaveBeenCalledWith('task-1', ['to-delete']);
    });

    /**
     * @test Validates behavior when emptying all subtasks.
     */
    it('should delete all subtasks if empty array is submitted', async () => {
      mockRepository.getSubtaskRows.mockResolvedValueOnce([{ id: 'sub-1' }, { id: 'sub-2' }]);
      mockRepository.getSubtaskRows.mockResolvedValueOnce([]);

      await service.replaceSubtasks('task-1', []);

      expect(mockRepository.updateTaskSubtask).not.toHaveBeenCalled();
      expect(mockRepository.createSubtask).not.toHaveBeenCalled();
      expect(mockRepository.deleteTaskSubtasks).toHaveBeenCalledWith('task-1', ['sub-1', 'sub-2']);
    });
  });

  describe('createAssignments', () => {
    /**
     * @test Validates delegation of batch task assignment creation and uniqueness filter.
     */
    it('should filter duplicate contacts and delegate creation to the repository', async () => {
      mockRepository.createTaskAssignments.mockResolvedValue(undefined);

      await service.createAssignments('task-1', ['c1', 'c2', 'c1']);

      expect(mockRepository.createTaskAssignments).toHaveBeenCalledWith('task-1', ['c1', 'c2']);
    });

    /**
     * @test Handles empty contact array gracefully.
     */
    it('should handle empty assignment array', async () => {
      mockRepository.createTaskAssignments.mockResolvedValue(undefined);

      await service.createAssignments('task-1', []);

      expect(mockRepository.createTaskAssignments).toHaveBeenCalledWith('task-1', []);
    });
  });

  describe('assignContact', () => {
    /**
     * @test Validates assignment of a single contact and refreshing of the list.
     */
    it('should assign a contact and return the updated list', async () => {
      mockRepository.createTaskAssignment.mockResolvedValue(undefined);
      mockRepository.getAssignedContacts.mockResolvedValue([MOCK_CONTACTS[0]]);

      const result = await service.assignContact('task-1', 'c1');

      expect(mockRepository.createTaskAssignment).toHaveBeenCalledWith('task-1', 'c1');
      expect(result).toEqual([MOCK_CONTACTS[0]]);
    });

    /**
     * @test Ensures error is thrown if assignment fails.
     */
    it('should throw an error if assignment fails in DB', async () => {
      mockRepository.createTaskAssignment.mockRejectedValue(new Error('Constraint failed'));

      await expect(service.assignContact('task-1', 'c1')).rejects.toThrow('Constraint failed');
    });
  });

  describe('removeContact', () => {
    /**
     * @test Validates removal of a single contact and refreshing of the list.
     */
    it('should remove a contact and return the updated list', async () => {
      mockRepository.deleteTaskAssignment.mockResolvedValue(undefined);
      mockRepository.getAssignedContacts.mockResolvedValue([]);

      const result = await service.removeContact('task-1', 'c1');

      expect(mockRepository.deleteTaskAssignment).toHaveBeenCalledWith('task-1', 'c1');
      expect(result).toEqual([]);
    });
  });

  describe('replaceAssignments', () => {
    /**
     * @test Validates full synchronization of assignments (deletions and additions).
     */
    it('should delete removed contacts and add new contacts during assignment replacement', async () => {
      mockRepository.getAssignedContactIds.mockResolvedValue(['c1', 'c2']);
      mockRepository.getAssignedContacts.mockResolvedValue([MOCK_CONTACTS[1], MOCK_CONTACTS[2]]);

      const requestedContactIds = ['c2', 'c3', 'c3'];

      await service.replaceAssignments('task-1', requestedContactIds);

      expect(mockRepository.deleteTaskAssignments).toHaveBeenCalledWith('task-1', ['c1']);
      expect(mockRepository.createTaskAssignments).toHaveBeenCalledWith('task-1', ['c3']);
    });

    /**
     * @test Validates behavior when emptying all assignments.
     */
    it('should delete all assignments if an empty array is provided', async () => {
      mockRepository.getAssignedContactIds.mockResolvedValue(['c1', 'c2']);
      mockRepository.getAssignedContacts.mockResolvedValue([]);

      await service.replaceAssignments('task-1', []);

      expect(mockRepository.deleteTaskAssignments).toHaveBeenCalledWith('task-1', ['c1', 'c2']);
      expect(mockRepository.createTaskAssignments).toHaveBeenCalledWith('task-1', []);
    });

    /**
     * @test Validates behavior when the assignment state remains completely unchanged.
     */
    it('should not perform deletions or creations if the state is identical', async () => {
      mockRepository.getAssignedContactIds.mockResolvedValue(['c1', 'c2']);
      mockRepository.getAssignedContacts.mockResolvedValue([MOCK_CONTACTS[0], MOCK_CONTACTS[1]]);

      await service.replaceAssignments('task-1', ['c2', 'c1']);

      expect(mockRepository.deleteTaskAssignments).toHaveBeenCalledWith('task-1', []);
      expect(mockRepository.createTaskAssignments).toHaveBeenCalledWith('task-1', []);
    });
  });

  describe('updateOptionalSubtasks', () => {
    /**
     * @test Validates that optional subtask updates are ignored when undefined.
     */
    it('should return undefined if no optional subtask inputs are provided', async () => {
      const result = await service.updateOptionalSubtasks('task-1', undefined);
      expect(result).toBeUndefined();
      expect(mockRepository.getSubtaskRows).not.toHaveBeenCalled();
    });

    /**
     * @test Validates that an empty array is treated as a valid update (deletion of all subtasks).
     */
    it('should process empty array and delete all subtasks', async () => {
      mockRepository.getSubtaskRows.mockResolvedValue([{ id: 'sub-1' }]);

      await service.updateOptionalSubtasks('task-1', []);
      
      expect(mockRepository.deleteTaskSubtasks).toHaveBeenCalledWith('task-1', ['sub-1']);
    });

    /**
     * @test Validates that optional subtask updates delegate to replaceSubtasks when defined.
     */
    it('should delegate to replaceSubtasks when optional subtasks are provided', async () => {
      mockRepository.getSubtaskRows.mockResolvedValue([]);
      mockRepository.getSubtaskRows.mockResolvedValue([{ id: 'new-1' }]);
      
      const inputs: UpdateTaskSubtaskInput[] = [{ title: 'New Optional' }];
      await service.updateOptionalSubtasks('task-1', inputs);
      
      expect(mockRepository.createSubtask).toHaveBeenCalled();
    });
  });

  describe('updateOptionalAssignments', () => {
    /**
     * @test Validates that optional assignment updates are ignored when undefined.
     */
    it('should return undefined if no optional assignment inputs are provided', async () => {
      const result = await service.updateOptionalAssignments('task-1', undefined);
      expect(result).toBeUndefined();
      expect(mockRepository.getAssignedContactIds).not.toHaveBeenCalled();
    });

    /**
     * @test Validates that an empty array clears all assignments.
     */
    it('should clear all assignments when an empty array is provided', async () => {
      mockRepository.getAssignedContactIds.mockResolvedValue(['c1']);
      
      await service.updateOptionalAssignments('task-1', []);
      
      expect(mockRepository.deleteTaskAssignments).toHaveBeenCalledWith('task-1', ['c1']);
    });

    /**
     * @test Validates that optional assignment updates delegate to replaceAssignments when defined.
     */
    it('should delegate to replaceAssignments when optional assignments are provided', async () => {
      mockRepository.getAssignedContactIds.mockResolvedValue([]);
      mockRepository.getAssignedContacts.mockResolvedValue([]);

      await service.updateOptionalAssignments('task-1', ['c1']);
      
      expect(mockRepository.createTaskAssignments).toHaveBeenCalledWith('task-1', ['c1']);
    });
  });
});