/**
 * @fileoverview Exhaustive unit tests for the TaskService.
 * Validates orchestration of repository requests, state updates,
 * relation operations, loading states, and error handling rollbacks.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { TaskService } from './task.service';
import { TaskRepository } from '../repositories/task.repository';
import { TaskRelationsService } from './task-relations.service';
import { TaskStateService } from './task-state.service';
import { TaskRow, Task, CreateTask, UpdateTask, TaskPositionUpdate } from '../models/task.model';
import { Subtask, CreateSubtask, UpdateSubtask } from '../models/subtask.model';
import { Contact } from '../models/contact.model';
import { CreateTaskWithRelationsInput, UpdateTaskWithRelationsInput, UpdateTaskSubtaskInput } from '../models/task-persistence.model';
import { BoardRelationsData } from '../models/task-relations.model';

/**
 * @constant MOCK_TASK_ROWS
 * @description Mock data representing raw task database responses in snake_case.
 */
const MOCK_TASK_ROWS: TaskRow[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Desc 1',
    due_date: '2023-12-31',
    priority: 'low',
    category: 'user_story',
    status: 'todo',
    sort_order: 0,
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Desc 2',
    due_date: '2023-12-31',
    priority: 'medium',
    category: 'technical_task',
    status: 'in_progress',
    sort_order: 1,
    created_at: '2023-01-02T12:00:00Z',
    updated_at: '2023-01-02T12:00:00Z'
  }
];

/**
 * @constant MOCK_TASKS
 * @description Mock data representing complete application task entities.
 */
const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Desc 1',
    dueDate: '2023-12-31',
    priority: 'low',
    category: 'user_story',
    status: 'todo',
    sortOrder: 0,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
  }
];

/**
 * @constant MOCK_SUBTASKS
 * @description Mock data representing subtasks belonging to tasks.
 */
const MOCK_SUBTASKS: Subtask[] = [
  { id: 'sub-1', taskId: 'task-1', title: 'Subtask 1', sortOrder: 0, isCompleted: false, createdAt: '2023-01-01T12:00:00Z', updatedAt: '2023-01-01T12:00:00Z' }
];

/**
 * @constant MOCK_CONTACTS
 * @description Mock data representing application contact state in camelCase.
 */
const MOCK_CONTACTS: Contact[] = [
  { id: 'contact-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: null, badgeColor: '#ff0000', authUserId: 'auth-1', createdAt: '2023-01-01T12:00:00Z', updatedAt: '2023-01-01T12:00:00Z' }
];

/**
 * @description Test suite for the TaskService.
 */
describe('TaskService', () => {
  let service: TaskService;
  let mockRepository: any;
  let mockRelations: any;
  let mockState: any;

  /**
   * @description Sets up the test environment and instantiates a fresh service with mocked dependencies.
   */
  beforeEach(() => {
    mockRepository = {
      getTaskRows: vi.fn(),
      getTaskRowById: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      updateTaskPositions: vi.fn(),
      deleteTask: vi.fn(),
      getSubtaskRows: vi.fn(),
      getAssignedContacts: vi.fn()
    };

    mockRelations = {
      getSubtasks: vi.fn(),
      getAssignedContacts: vi.fn(),
      loadBoardRelations: vi.fn(),
      createSubtask: vi.fn(),
      updateSubtask: vi.fn(),
      deleteSubtask: vi.fn(),
      createSubtasksForTask: vi.fn(),
      createAssignments: vi.fn(),
      updateOptionalSubtasks: vi.fn(),
      updateOptionalAssignments: vi.fn(),
      replaceSubtasks: vi.fn(),
      assignContact: vi.fn(),
      removeContact: vi.fn(),
      replaceAssignments: vi.fn()
    };

    mockState = {
      allTasks: signal<Task[]>([]),
      selectedTask: signal<Task | null>(null),
      selectedSubtasks: signal<Subtask[]>([]),
      assignedContacts: signal<Contact[]>([]),
      setTasks: vi.fn(),
      selectTask: vi.fn(),
      setSubtasksForTask: vi.fn(),
      setContactsForTask: vi.fn(),
      addTask: vi.fn(),
      applyCreatedTask: vi.fn(),
      updateTask: vi.fn(),
      applyTaskUpdates: vi.fn(),
      applyUpdatedTask: vi.fn(),
      removeTask: vi.fn(),
      addSubtask: vi.fn(),
      updateSubtask: vi.fn(),
      removeSubtask: vi.fn(),
      setSelectedSubtasks: vi.fn(),
      setAssignedContacts: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: TaskRepository, useValue: mockRepository },
        { provide: TaskRelationsService, useValue: mockRelations },
        { provide: TaskStateService, useValue: mockState },
      ],
    });

    service = TestBed.inject(TaskService);
  });

  /**
   * @test Verifies dependency injection and initial exposed signal states.
   */
  it('should be created and expose empty initial state', () => {
    expect(service).toBeTruthy();
    expect(service.allTasks()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.errorMessage()).toBe('');
  });

  describe('getTasks', () => {
    /**
     * @test Validates loading all tasks and updating the state service.
     */
    it('should load tasks, map them, and update state', async () => {
      mockRepository.getTaskRows.mockResolvedValue(MOCK_TASK_ROWS);

      const result = await service.getTasks();

      expect(mockRepository.getTaskRows).toHaveBeenCalled();
      expect(mockState.setTasks).toHaveBeenCalledWith(expect.any(Array));
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('task-1');
      expect(service.isLoading()).toBe(false);
      expect(service.errorMessage()).toBe('');
    });

    /**
     * @test Ensures errors during fetch update the error message state.
     */
    it('should set error message if loading tasks fails', async () => {
      mockRepository.getTaskRows.mockRejectedValue(new Error('Network Error'));

      await expect(service.getTasks()).rejects.toThrow('Network Error');
      expect(service.errorMessage()).toBe('Tasks could not be loaded.');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('getTaskById', () => {
    /**
     * @test Validates retrieving a single task and selecting it in state.
     */
    it('should load a single task by id and select it', async () => {
      mockRepository.getTaskRowById.mockResolvedValue(MOCK_TASK_ROWS[0]);

      const result = await service.getTaskById('task-1');

      expect(mockRepository.getTaskRowById).toHaveBeenCalledWith('task-1');
      expect(mockState.selectTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
      expect(result?.id).toBe('task-1');
    });

    /**
     * @test Validates behavior when the requested task is not found.
     */
    it('should return null and clear selection if task is not found', async () => {
      mockRepository.getTaskRowById.mockResolvedValue(null);

      const result = await service.getTaskById('unknown');

      expect(mockState.selectTask).toHaveBeenCalledWith(null);
      expect(result).toBeNull();
    });
  });

  describe('getSubtasksByTaskId', () => {
    /**
     * @test Validates retrieving subtasks and syncing them with the state service.
     */
    it('should load subtasks and set them in state', async () => {
      mockRelations.getSubtasks.mockResolvedValue(MOCK_SUBTASKS);

      const result = await service.getSubtasksByTaskId('task-1');

      expect(mockRelations.getSubtasks).toHaveBeenCalledWith('task-1');
      expect(mockState.setSubtasksForTask).toHaveBeenCalledWith('task-1', MOCK_SUBTASKS);
      expect(result).toEqual(MOCK_SUBTASKS);
    });
  });

  describe('getAssignedContacts', () => {
    /**
     * @test Validates retrieving assigned contacts and syncing them with the state service.
     */
    it('should load assigned contacts and set them in state', async () => {
      mockRelations.getAssignedContacts.mockResolvedValue(MOCK_CONTACTS);

      const result = await service.getAssignedContacts('task-1');

      expect(mockRelations.getAssignedContacts).toHaveBeenCalledWith('task-1');
      expect(mockState.setContactsForTask).toHaveBeenCalledWith('task-1', MOCK_CONTACTS);
      expect(result).toEqual(MOCK_CONTACTS);
    });
  });

  describe('loadAllBoardData', () => {
    /**
     * @test Validates delegation to relations service for board data loading.
     */
    it('should delegate loading board relations to relations service', async () => {
      const mockData: BoardRelationsData = { subtasks: MOCK_SUBTASKS, assignments: [] };
      mockRelations.loadBoardRelations.mockResolvedValue(mockData);

      const result = await service.loadAllBoardData();

      expect(mockRelations.loadBoardRelations).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('createTask', () => {
    /**
     * @test Validates task creation, mapping, and synchronization with state.
     */
    it('should create a task, map it, and update state', async () => {
      const input: CreateTask = { title: 'New Task', dueDate: '2023-12-31', category: 'user_story' };
      mockRepository.createTask.mockResolvedValue(MOCK_TASK_ROWS[0]);

      const result = await service.createTask(input);

      expect(mockRepository.createTask).toHaveBeenCalledWith(input);
      expect(mockState.addTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
      expect(mockState.selectTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
      expect(result.id).toBe('task-1');
    });

    /**
     * @test Ensures errors during creation update the error message state.
     */
    it('should set error message if task creation fails', async () => {
      mockRepository.createTask.mockRejectedValue(new Error('Creation Failed'));

      await expect(service.createTask({} as any)).rejects.toThrow('Creation Failed');
      expect(service.errorMessage()).toBe('Task could not be created.');
    });
  });

  describe('createTaskWithRelations', () => {
    /**
     * @test Validates full creation flow including subtasks, assignments, and state updates.
     */
    it('should create task, subtasks, assignments and apply to state', async () => {
      const input: CreateTaskWithRelationsInput = {
        task: { title: 'New Task', dueDate: '2023-12-31', category: 'user_story' },
        subtasks: [{ title: 'Sub 1' }],
        contactIds: ['contact-1']
      };

      mockRepository.createTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
      mockRelations.createSubtasksForTask.mockResolvedValue(MOCK_SUBTASKS);
      mockRelations.createAssignments.mockResolvedValue(undefined);
      mockRelations.getAssignedContacts.mockResolvedValue(MOCK_CONTACTS);

      const result = await service.createTaskWithRelations(input);

      expect(mockRepository.createTask).toHaveBeenCalledWith(input.task);
      expect(mockRelations.createSubtasksForTask).toHaveBeenCalledWith('task-1', input.subtasks);
      expect(mockRelations.createAssignments).toHaveBeenCalledWith('task-1', input.contactIds);
      expect(mockState.applyCreatedTask).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'task-1' }),
        MOCK_SUBTASKS,
        MOCK_CONTACTS
      );
      expect(result.id).toBe('task-1');
    });

    /**
     * @test Validates best-effort rollback when relation creation fails after task is created.
     */
    it('should rollback task creation if relation creation fails', async () => {
      const input: CreateTaskWithRelationsInput = { task: {} as any, subtasks: [{ title: 'Sub 1' }] };
      mockRepository.createTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
      mockRelations.createSubtasksForTask.mockRejectedValue(new Error('Subtask Error'));
      mockRepository.deleteTask.mockResolvedValue(undefined);

      await expect(service.createTaskWithRelations(input)).rejects.toThrow('Subtask Error');
      expect(mockRepository.deleteTask).toHaveBeenCalledWith('task-1');
      expect(service.errorMessage()).toBe('Task and its relations could not be created.');
    });

    /**
     * @test Validates that an error during rollback does not mask the original failure.
     */
    it('should ignore rollback errors and throw original error', async () => {
      const input: CreateTaskWithRelationsInput = { task: {} as any, subtasks: [{ title: 'Sub 1' }] };
      mockRepository.createTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
      mockRelations.createSubtasksForTask.mockRejectedValue(new Error('Subtask Error'));
      mockRepository.deleteTask.mockRejectedValue(new Error('Rollback Error')); // Fails

      await expect(service.createTaskWithRelations(input)).rejects.toThrow('Subtask Error');
    });
  });

  describe('updateTask', () => {
    /**
     * @test Validates updating a task and synchronizing it with the state service.
     */
    it('should update a task and synchronize state', async () => {
      const updateData: UpdateTask = { title: 'Updated' };
      mockRepository.updateTask.mockResolvedValue(MOCK_TASK_ROWS[0]);

      const result = await service.updateTask('task-1', updateData);

      expect(mockRepository.updateTask).toHaveBeenCalledWith('task-1', updateData);
      expect(mockState.updateTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
      expect(result.id).toBe('task-1');
    });
  });

  describe('updateTaskPositions', () => {
    /**
     * @test Validates persisting board positions and updating the local task collection.
     */
    it('should save positions and apply bulk updates to state', async () => {
      const updates: TaskPositionUpdate[] = [{ id: 'task-1', status: 'done', sortOrder: 5 }];
      mockRepository.updateTaskPositions.mockResolvedValue(MOCK_TASK_ROWS);

      await service.updateTaskPositions(updates);

      expect(mockRepository.updateTaskPositions).toHaveBeenCalledWith(updates);
      expect(mockState.applyTaskUpdates).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('updateTaskWithRelations', () => {
    /**
     * @test Validates the complete update flow for a task and optional relations.
     */
    it('should update task and optional relations successfully', async () => {
      const input: UpdateTaskWithRelationsInput = {
        task: { title: 'Updated Task' },
        subtasks: [{ title: 'New Sub' }]
      };
      mockRepository.updateTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
      mockRelations.updateOptionalSubtasks.mockResolvedValue(MOCK_SUBTASKS);
      mockRelations.updateOptionalAssignments.mockResolvedValue(undefined);

      const result = await service.updateTaskWithRelations('task-1', input);

      expect(mockRepository.updateTask).toHaveBeenCalledWith('task-1', input.task);
      expect(mockRelations.updateOptionalSubtasks).toHaveBeenCalledWith('task-1', input.subtasks);
      expect(mockRelations.updateOptionalAssignments).toHaveBeenCalledWith('task-1', undefined);
      expect(mockState.applyUpdatedTask).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'task-1' }),
        MOCK_SUBTASKS,
        undefined
      );
      expect(result.id).toBe('task-1');
    });

    /**
     * @test Validates that state is refreshed from the database if an update fails midway.
     */
    it('should attempt state refresh if relation update fails', async () => {
      const input: UpdateTaskWithRelationsInput = { task: {} as any, subtasks: [] };
      mockRepository.updateTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
      mockRelations.updateOptionalSubtasks.mockRejectedValue(new Error('Update Failed'));
      mockRepository.getTaskRowById.mockResolvedValue(MOCK_TASK_ROWS[0]);
      
      // Simulate task being the currently selected one
      mockState.selectedTask.set(MOCK_TASKS[0]);
      mockRepository.getSubtaskRows.mockResolvedValue([]);
      mockRepository.getAssignedContacts.mockResolvedValue([]);

      await expect(service.updateTaskWithRelations('task-1', input)).rejects.toThrow('Update Failed');

      expect(mockRepository.getTaskRowById).toHaveBeenCalledWith('task-1');
      expect(mockState.updateTask).toHaveBeenCalled();
      expect(mockState.setSelectedSubtasks).toHaveBeenCalled();
      expect(mockState.setAssignedContacts).toHaveBeenCalled();
      expect(service.errorMessage()).toBe('Task and its relations could not be updated.');
    });

    /**
     * @test Validates that the state refresh is bypassed smoothly if the task row is no longer found.
     */
    it('should not throw secondary error if refresh finds no task row', async () => {
      const input: UpdateTaskWithRelationsInput = { task: {} as any };
      mockRepository.updateTask.mockResolvedValue(MOCK_TASK_ROWS[0]);
      mockRelations.updateOptionalSubtasks.mockRejectedValue(new Error('Failed'));
      mockRepository.getTaskRowById.mockResolvedValue(null); // Returns null

      await expect(service.updateTaskWithRelations('task-1', input)).rejects.toThrow('Failed');
      expect(mockState.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('replaceTaskSubtasks', () => {
    /**
     * @test Validates replacement of task subtasks and state synchronization.
     */
    it('should replace subtasks and update state for the specific task', async () => {
      const inputs: UpdateTaskSubtaskInput[] = [{ title: 'Replaced Sub' }];
      mockRelations.replaceSubtasks.mockResolvedValue(MOCK_SUBTASKS);

      const result = await service.replaceTaskSubtasks('task-1', inputs);

      expect(mockRelations.replaceSubtasks).toHaveBeenCalledWith('task-1', inputs);
      expect(mockState.setSubtasksForTask).toHaveBeenCalledWith('task-1', MOCK_SUBTASKS);
      expect(result).toEqual(MOCK_SUBTASKS);
    });
  });

  describe('deleteTask', () => {
    /**
     * @test Validates task deletion delegation to repository and state cleanup.
     */
    it('should delete task and remove it from state', async () => {
      mockRepository.deleteTask.mockResolvedValue(undefined);

      await service.deleteTask('task-1');

      expect(mockRepository.deleteTask).toHaveBeenCalledWith('task-1');
      expect(mockState.removeTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('createSubtask', () => {
    /**
     * @test Validates creating a single subtask and adding it to the state.
     */
    it('should create a subtask and delegate to state service', async () => {
      const input: CreateSubtask = { taskId: 'task-1', title: 'New Sub' };
      mockRelations.createSubtask.mockResolvedValue(MOCK_SUBTASKS[0]);

      const result = await service.createSubtask(input);

      expect(mockRelations.createSubtask).toHaveBeenCalledWith(input);
      expect(mockState.addSubtask).toHaveBeenCalledWith(MOCK_SUBTASKS[0]);
      expect(result).toEqual(MOCK_SUBTASKS[0]);
    });
  });

  describe('updateSubtask', () => {
    /**
     * @test Validates updating a single subtask and syncing the state.
     */
    it('should update a subtask and delegate to state service', async () => {
      const updateData: UpdateSubtask = { title: 'Updated' };
      mockRelations.updateSubtask.mockResolvedValue(MOCK_SUBTASKS[0]);

      const result = await service.updateSubtask('sub-1', updateData);

      expect(mockRelations.updateSubtask).toHaveBeenCalledWith('sub-1', updateData);
      expect(mockState.updateSubtask).toHaveBeenCalledWith(MOCK_SUBTASKS[0]);
      expect(result).toEqual(MOCK_SUBTASKS[0]);
    });
  });

  describe('toggleSubtaskCompletion', () => {
    /**
     * @test Validates toggling subtask completion as a wrapper around updateSubtask.
     */
    it('should call updateSubtask with correct completion boolean', async () => {
      mockRelations.updateSubtask.mockResolvedValue(MOCK_SUBTASKS[0]);

      await service.toggleSubtaskCompletion('sub-1', true);

      expect(mockRelations.updateSubtask).toHaveBeenCalledWith('sub-1', { isCompleted: true });
    });
  });

  describe('deleteSubtask', () => {
    /**
     * @test Validates deletion of a single subtask and state removal.
     */
    it('should delete a subtask and remove it from state', async () => {
      mockRelations.deleteSubtask.mockResolvedValue(undefined);

      await service.deleteSubtask('sub-1');

      expect(mockRelations.deleteSubtask).toHaveBeenCalledWith('sub-1');
      expect(mockState.removeSubtask).toHaveBeenCalledWith('sub-1');
    });
  });

  describe('assignContact', () => {
    /**
     * @test Validates assigning a contact to a task and state synchronization.
     */
    it('should assign contact and set new contacts for task state', async () => {
      mockRelations.assignContact.mockResolvedValue(MOCK_CONTACTS);

      const result = await service.assignContact('task-1', 'contact-1');

      expect(mockRelations.assignContact).toHaveBeenCalledWith('task-1', 'contact-1');
      expect(mockState.setContactsForTask).toHaveBeenCalledWith('task-1', MOCK_CONTACTS);
      expect(result).toEqual(MOCK_CONTACTS);
    });
  });

  describe('removeContactAssignment', () => {
    /**
     * @test Validates removing a contact assignment and state synchronization.
     */
    it('should remove contact assignment and set new contacts for task state', async () => {
      mockRelations.removeContact.mockResolvedValue([]);

      const result = await service.removeContactAssignment('task-1', 'contact-1');

      expect(mockRelations.removeContact).toHaveBeenCalledWith('task-1', 'contact-1');
      expect(mockState.setContactsForTask).toHaveBeenCalledWith('task-1', []);
      expect(result).toEqual([]);
    });
  });

  describe('replaceTaskAssignments', () => {
    /**
     * @test Validates complete replacement of task assignments and state synchronization.
     */
    it('should replace assignments and set new contacts for task state', async () => {
      mockRelations.replaceAssignments.mockResolvedValue(MOCK_CONTACTS);

      const result = await service.replaceTaskAssignments('task-1', ['contact-1']);

      expect(mockRelations.replaceAssignments).toHaveBeenCalledWith('task-1', ['contact-1']);
      expect(mockState.setContactsForTask).toHaveBeenCalledWith('task-1', MOCK_CONTACTS);
      expect(result).toEqual(MOCK_CONTACTS);
    });
  });
});