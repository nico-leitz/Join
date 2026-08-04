/**
 * @fileoverview Exhaustive unit tests for the TaskStateService.
 * Validates signal state mutations, task collection management,
 * conditional relation updates, and selection behaviors.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { TaskStateService } from './task-state.service';
import { Task } from '../models/task.model';
import { Subtask } from '../models/subtask.model';
import { Contact } from '../models/contact.model';

/**
 * @constant MOCK_CONTACTS
 * @description Mock data representing application contact state in camelCase.
 */
const MOCK_CONTACTS: Contact[] = [
  { 
    id: 'contact-1', 
    firstName: 'John', 
    lastName: 'Doe', 
    email: 'john@example.com', 
    phone: null,
    badgeColor: '#ff0000', 
    authUserId: 'auth-1',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
  },
  { 
    id: 'contact-2', 
    firstName: 'Jane', 
    lastName: 'Smith', 
    email: 'jane@example.com', 
    phone: '+1234567890',
    badgeColor: '#00ff00', 
    authUserId: 'auth-2',
    createdAt: '2023-01-02T12:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z'
  }
];

/**
 * @constant MOCK_SUBTASKS
 * @description Mock data representing subtasks belonging to various tasks.
 */
const MOCK_SUBTASKS: Subtask[] = [
  { 
    id: 'sub-1', 
    taskId: 'task-1', 
    title: 'Subtask 1', 
    sortOrder: 0, 
    isCompleted: false,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
  },
  { 
    id: 'sub-2', 
    taskId: 'task-1', 
    title: 'Subtask 2', 
    sortOrder: 1, 
    isCompleted: true,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
  },
  { 
    id: 'sub-3', 
    taskId: 'task-2', 
    title: 'Subtask 3', 
    sortOrder: 0, 
    isCompleted: false,
    createdAt: '2023-01-02T12:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z'
  }
];

/**
 * @constant MOCK_TASKS
 * @description Mock data representing complete task entities conforming to the Task model.
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
  },
  { 
    id: 'task-2', 
    title: 'Task 2', 
    description: 'Desc 2', 
    dueDate: '2023-12-31',
    priority: 'medium', 
    category: 'technical_task', 
    status: 'in_progress', 
    sortOrder: 1,
    createdAt: '2023-01-02T12:00:00Z', 
    updatedAt: '2023-01-02T12:00:00Z' 
  }
];

/**
 * @description Test suite for the TaskStateService focusing on Angular Signals state management.
 */
describe('TaskStateService', () => {
  let service: TaskStateService;

  /**
   * @description Sets up the test environment and instantiates a fresh service before each test.
   */
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskStateService],
    });

    service = TestBed.inject(TaskStateService);
  });

  /**
   * @test Verifies dependency injection and initial signal states.
   */
  it('should be created and initialized with empty state', () => {
    expect(service).toBeTruthy();
    expect(service.allTasks()).toEqual([]);
    expect(service.selectedTask()).toBeNull();
    expect(service.selectedSubtasks()).toEqual([]);
    expect(service.assignedContacts()).toEqual([]);
  });

  describe('setTasks', () => {
    /**
     * @test Validates that setTasks replaces the entire task collection.
     */
    it('should set all tasks to the provided array', () => {
      service.setTasks(MOCK_TASKS);
      expect(service.allTasks().length).toBe(2);
      expect(service.allTasks()[0].id).toBe('task-1');
    });

    /**
     * @test Validates that providing an empty array clears the task collection.
     */
    it('should clear tasks when an empty array is provided', () => {
      service.setTasks(MOCK_TASKS);
      service.setTasks([]);
      expect(service.allTasks().length).toBe(0);
    });
  });

  describe('selectTask', () => {
    /**
     * @test Validates that a specific task can be selected.
     */
    it('should set the selected task', () => {
      service.selectTask(MOCK_TASKS[0]);
      expect(service.selectedTask()).toEqual(MOCK_TASKS[0]);
    });

    /**
     * @test Validates that the task selection can be cleared explicitly by passing null.
     */
    it('should clear the selected task when null is passed', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.selectTask(null);
      expect(service.selectedTask()).toBeNull();
    });
  });

  describe('setSelectedSubtasks', () => {
    /**
     * @test Validates replacing the complete selected subtask state.
     */
    it('should replace the selected subtasks signal', () => {
      service.setSelectedSubtasks(MOCK_SUBTASKS);
      expect(service.selectedSubtasks().length).toBe(3);
      expect(service.selectedSubtasks()[0].id).toBe('sub-1');
    });
  });

  describe('setAssignedContacts', () => {
    /**
     * @test Validates replacing the complete assigned contacts state.
     */
    it('should replace the assigned contacts signal', () => {
      service.setAssignedContacts(MOCK_CONTACTS);
      expect(service.assignedContacts().length).toBe(2);
      expect(service.assignedContacts()[1].id).toBe('contact-2');
    });
  });

  describe('setSubtasksForTask', () => {
    /**
     * @test Validates that subtasks are stored if the provided task ID matches the current selection.
     */
    it('should update selected subtasks if the task is currently selected', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.setSubtasksForTask('task-1', [MOCK_SUBTASKS[0], MOCK_SUBTASKS[1]]);
      expect(service.selectedSubtasks().length).toBe(2);
    });

    /**
     * @test Validates that subtasks are ignored if the provided task ID does not match the current selection.
     */
    it('should not update selected subtasks if the task is not currently selected', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.setSubtasksForTask('task-2', [MOCK_SUBTASKS[2]]);
      expect(service.selectedSubtasks().length).toBe(0);
    });

    /**
     * @test Validates that subtasks are ignored if no task is currently selected.
     */
    it('should not update selected subtasks if no task is selected', () => {
      service.setSubtasksForTask('task-1', MOCK_SUBTASKS);
      expect(service.selectedSubtasks().length).toBe(0);
    });
  });

  describe('setContactsForTask', () => {
    /**
     * @test Validates that contacts are stored if the provided task ID matches the current selection.
     */
    it('should update assigned contacts if the task is currently selected', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.setContactsForTask('task-1', MOCK_CONTACTS);
      expect(service.assignedContacts().length).toBe(2);
    });

    /**
     * @test Validates that contacts are ignored if the provided task ID does not match the current selection.
     */
    it('should not update assigned contacts if the task is not currently selected', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.setContactsForTask('task-2', MOCK_CONTACTS);
      expect(service.assignedContacts().length).toBe(0);
    });

    /**
     * @test Validates that contacts are ignored if no task is currently selected.
     */
    it('should not update assigned contacts if no task is selected', () => {
      service.setContactsForTask('task-1', MOCK_CONTACTS);
      expect(service.assignedContacts().length).toBe(0);
    });
  });

  describe('applyCreatedTask', () => {
    /**
     * @test Validates that creating a task updates all global and selection state signals simultaneously.
     */
    it('should add task, select it, and populate its relation states', () => {
      service.applyCreatedTask(MOCK_TASKS[0], [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);

      expect(service.allTasks().length).toBe(1);
      expect(service.allTasks()[0].id).toBe('task-1');
      expect(service.selectedTask()?.id).toBe('task-1');
      expect(service.selectedSubtasks().length).toBe(1);
      expect(service.assignedContacts().length).toBe(1);
    });
  });

  describe('applyUpdatedTask', () => {
    /**
     * @test Validates that updating an unselected task updates the collection without touching relation signals.
     */
    it('should update the task collection but ignore relations if task is not selected', () => {
      service.setTasks(MOCK_TASKS);
      service.selectTask(MOCK_TASKS[0]);

      const updatedTask2: Task = { ...MOCK_TASKS[1], title: 'Updated Task 2' };

      service.applyUpdatedTask(updatedTask2, MOCK_SUBTASKS, MOCK_CONTACTS);

      const task2InState = service.allTasks().find(t => t.id === 'task-2');
      expect(task2InState?.title).toBe('Updated Task 2');
      expect(service.selectedSubtasks().length).toBe(0);
      expect(service.assignedContacts().length).toBe(0);
    });

    /**
     * @test Validates that updating the selected task updates both the collection and the submitted relation signals.
     */
    it('should update the task collection and apply relations if the task is currently selected', () => {
      service.setTasks(MOCK_TASKS);
      service.selectTask(MOCK_TASKS[0]);

      const updatedTask1: Task = { ...MOCK_TASKS[0], title: 'Updated Task 1' };

      service.applyUpdatedTask(updatedTask1, [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);

      const task1InState = service.allTasks().find(t => t.id === 'task-1');
      expect(task1InState?.title).toBe('Updated Task 1');
      expect(service.selectedTask()?.title).toBe('Updated Task 1');
      expect(service.selectedSubtasks().length).toBe(1);
      expect(service.assignedContacts().length).toBe(1);
    });

    /**
     * @test Validates that updating the selected task with undefined relations does not clear existing relations.
     */
    it('should leave existing relations intact if undefined is passed for the selected task', () => {
      service.applyCreatedTask(MOCK_TASKS[0], [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);

      const updatedTask1: Task = { ...MOCK_TASKS[0], priority: 'urgent' };

      service.applyUpdatedTask(updatedTask1, undefined, undefined);

      expect(service.selectedTask()?.priority).toBe('urgent');
      expect(service.selectedSubtasks().length).toBe(1);
      expect(service.assignedContacts().length).toBe(1);
    });

    /**
     * @test Validates that updating the selected task with empty arrays clears the existing relations.
     */
    it('should clear relations if empty arrays are passed for the selected task', () => {
      service.applyCreatedTask(MOCK_TASKS[0], [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);

      service.applyUpdatedTask(MOCK_TASKS[0], [], []);

      expect(service.selectedSubtasks().length).toBe(0);
      expect(service.assignedContacts().length).toBe(0);
    });
  });

  describe('addTask', () => {
    /**
     * @test Validates appending a task to an existing collection.
     */
    it('should add a task to the allTasks state', () => {
      service.addTask(MOCK_TASKS[0]);
      service.addTask(MOCK_TASKS[1]);

      expect(service.allTasks().length).toBe(2);
      expect(service.allTasks().find(t => t.id === 'task-2')).toBeDefined();
    });
  });

  describe('updateTask', () => {
    /**
     * @test Validates replacing an existing task in the allTasks signal based on ID.
     */
    it('should update task properties in the allTasks array', () => {
      service.setTasks(MOCK_TASKS);
      const modifiedTask = { ...MOCK_TASKS[0], status: 'done' as const };

      service.updateTask(modifiedTask);

      const updatedTaskInState = service.allTasks().find(t => t.id === 'task-1');
      expect(updatedTaskInState?.status).toBe('done');
    });

    /**
     * @test Validates that updating a task synchronizes the selectedTask signal if it matches.
     */
    it('should sync the updated properties to the selectedTask signal if it is the selected one', () => {
      service.setTasks(MOCK_TASKS);
      service.selectTask(MOCK_TASKS[1]);
      const modifiedTask = { ...MOCK_TASKS[1], priority: 'urgent' as const };

      service.updateTask(modifiedTask);

      expect(service.selectedTask()?.priority).toBe('urgent');
    });

    /**
     * @test Validates that updating a task does not affect the selectedTask signal if IDs mismatch.
     */
    it('should not sync properties to the selectedTask signal if a different task is selected', () => {
      service.setTasks(MOCK_TASKS);
      service.selectTask(MOCK_TASKS[0]);
      const modifiedTask = { ...MOCK_TASKS[1], priority: 'urgent' as const };

      service.updateTask(modifiedTask);

      expect(service.selectedTask()?.priority).toBe('low');
    });
  });

  describe('applyTaskUpdates', () => {
    /**
     * @test Validates batch updating of multiple task values simultaneously.
     */
    it('should apply updates to multiple tasks at once', () => {
      service.setTasks(MOCK_TASKS);

      const updates = [
        { ...MOCK_TASKS[0], status: 'in_progress' as const },
        { ...MOCK_TASKS[1], status: 'done' as const }
      ];

      service.applyTaskUpdates(updates);

      const t1 = service.allTasks().find(t => t.id === 'task-1');
      const t2 = service.allTasks().find(t => t.id === 'task-2');

      expect(t1?.status).toBe('in_progress');
      expect(t2?.status).toBe('done');
    });

    /**
     * @test Validates that batch updates correctly synchronize the selectedTask signal if included in the bulk.
     */
    it('should sync the selectedTask signal if it is part of the batch update', () => {
      service.setTasks(MOCK_TASKS);
      service.selectTask(MOCK_TASKS[0]);

      const updates = [
        { ...MOCK_TASKS[0], category: 'technical_task' as const }
      ];

      service.applyTaskUpdates(updates);

      expect(service.selectedTask()?.category).toBe('technical_task');
    });

    /**
     * @test Validates that unmentioned tasks remain completely unmodified during batch updates.
     */
    it('should leave tasks that are not included in the batch update unmodified', () => {
      service.setTasks(MOCK_TASKS);

      const updates = [
        { ...MOCK_TASKS[0], category: 'technical_task' as const }
      ];

      service.applyTaskUpdates(updates);

      const t2 = service.allTasks().find(t => t.id === 'task-2');
      expect(t2?.category).toBe('technical_task');
    });
  });

  describe('removeTask', () => {
    /**
     * @test Validates that a task is entirely removed from the allTasks collection.
     */
    it('should remove a task from the allTasks signal', () => {
      service.setTasks(MOCK_TASKS);

      service.removeTask('task-1');

      expect(service.allTasks().length).toBe(1);
      expect(service.allTasks()[0].id).toBe('task-2');
    });

    /**
     * @test Validates that removing the currently selected task resets the entire selection state.
     */
    it('should clear the selectedTask and relations if the removed task was selected', () => {
      service.applyCreatedTask(MOCK_TASKS[0], MOCK_SUBTASKS, MOCK_CONTACTS);

      service.removeTask('task-1');

      expect(service.selectedTask()).toBeNull();
      expect(service.selectedSubtasks().length).toBe(0);
      expect(service.assignedContacts().length).toBe(0);
    });

    /**
     * @test Validates that removing an unselected task preserves the active selection state.
     */
    it('should leave the selection state intact if a different task is removed', () => {
      service.setTasks(MOCK_TASKS);
      service.applyCreatedTask(MOCK_TASKS[0], [MOCK_SUBTASKS[0]], [MOCK_CONTACTS[0]]);

      service.removeTask('task-2');

      expect(service.selectedTask()?.id).toBe('task-1');
      expect(service.selectedSubtasks().length).toBe(1);
      expect(service.assignedContacts().length).toBe(1);
    });
  });

  describe('clearSelection', () => {
    /**
     * @test Validates that the selection mechanism properly resets all relevant signals.
     */
    it('should nullify the selected task and empty all relation arrays', () => {
      service.applyCreatedTask(MOCK_TASKS[0], MOCK_SUBTASKS, MOCK_CONTACTS);

      service.clearSelection();

      expect(service.selectedTask()).toBeNull();
      expect(service.selectedSubtasks()).toEqual([]);
      expect(service.assignedContacts()).toEqual([]);
    });
  });

  describe('addSubtask', () => {
    /**
     * @test Validates that a subtask is added to the selection array if its taskId matches the selected task.
     */
    it('should add a subtask to selectedSubtasks if it belongs to the selected task', () => {
      service.selectTask(MOCK_TASKS[0]);

      service.addSubtask(MOCK_SUBTASKS[0]);
      service.addSubtask(MOCK_SUBTASKS[1]);

      expect(service.selectedSubtasks().length).toBe(2);
      expect(service.selectedSubtasks().find(s => s.id === 'sub-2')).toBeDefined();
    });

    /**
     * @test Validates that adding a subtask with a foreign taskId is rejected and ignored.
     */
    it('should ignore a subtask if it belongs to a different task than the currently selected one', () => {
      service.selectTask(MOCK_TASKS[0]);

      service.addSubtask(MOCK_SUBTASKS[2]);

      expect(service.selectedSubtasks().length).toBe(0);
    });

    /**
     * @test Validates that adding a subtask without an active task selection does not throw errors and is ignored.
     */
    it('should ignore a subtask if no task is currently selected', () => {
      service.addSubtask(MOCK_SUBTASKS[0]);

      expect(service.selectedSubtasks().length).toBe(0);
    });
  });

  describe('updateSubtask', () => {
    /**
     * @test Validates replacing an existing subtask within the active selection state.
     */
    it('should replace matching subtask properties within the selectedSubtasks signal', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.setSelectedSubtasks([MOCK_SUBTASKS[0], MOCK_SUBTASKS[1]]);

      const modifiedSubtask = { ...MOCK_SUBTASKS[0], isCompleted: true };
      service.updateSubtask(modifiedSubtask);

      const sub1 = service.selectedSubtasks().find(s => s.id === 'sub-1');
      expect(sub1?.isCompleted).toBe(true);
      expect(service.selectedSubtasks().length).toBe(2);
    });

    /**
     * @test Validates behavior when updating a subtask ID that does not exist in the current selection state.
     */
    it('should maintain state integrity if an unmapped subtask ID is provided', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.setSelectedSubtasks([MOCK_SUBTASKS[0]]);

      const unknownSubtask = { ...MOCK_SUBTASKS[2], title: 'Unknown Modification' };
      service.updateSubtask(unknownSubtask);

      const sub1 = service.selectedSubtasks().find(s => s.id === 'sub-1');
      expect(sub1?.title).toBe('Subtask 1');
      expect(service.selectedSubtasks().length).toBe(1);
    });
  });

  describe('removeSubtask', () => {
    /**
     * @test Validates exact removal of a subtask from the selectedSubtasks state by ID.
     */
    it('should remove a subtask from selectedSubtasks by its identifier', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.setSelectedSubtasks([MOCK_SUBTASKS[0], MOCK_SUBTASKS[1]]);

      service.removeSubtask('sub-1');

      expect(service.selectedSubtasks().length).toBe(1);
      expect(service.selectedSubtasks()[0].id).toBe('sub-2');
    });

    /**
     * @test Validates behavior when trying to remove a subtask identifier that is not in state.
     */
    it('should leave selectedSubtasks unaltered if the subtask ID is not found', () => {
      service.selectTask(MOCK_TASKS[0]);
      service.setSelectedSubtasks([MOCK_SUBTASKS[0]]);

      service.removeSubtask('unknown-subtask-id');

      expect(service.selectedSubtasks().length).toBe(1);
      expect(service.selectedSubtasks()[0].id).toBe('sub-1');
    });
  });
});