import { Injectable, signal } from '@angular/core';
import { Contact } from '../models/contact.model';
import { Subtask } from '../models/subtask.model';
import { Task } from '../models/task.model';
import {
  replaceSubtask,
  replaceTask,
  sortSubtasks,
  sortTasks,
} from '../utils/task-state.utils';

/**
 * Owns and synchronizes the in-memory state used by task views.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskStateService {
  /** Complete sorted task collection held in application state. */
  readonly allTasks = signal<Task[]>([]);

  /** Currently selected task or null when no task is selected. */
  readonly selectedTask = signal<Task | null>(null);

  /** Sorted subtasks belonging to the selected task. */
  readonly selectedSubtasks = signal<Subtask[]>([]);

  /** Contacts assigned to the selected task. */
  readonly assignedContacts = signal<Contact[]>([]);

  /**
   * Replaces the complete task collection and restores board sort order.
   *
   * @param tasks - Tasks to store.
   */
  setTasks(tasks: Task[]): void {
    this.allTasks.set(sortTasks(tasks));
  }

  /**
   * Replaces the currently selected task.
   *
   * @param task - Task to select or null to clear the task selection.
   */
  selectTask(task: Task | null): void {
    this.selectedTask.set(task);
  }

  /**
   * Replaces and sorts the subtasks of the selected task.
   *
   * @param subtasks - Subtasks to store for the current selection.
   */
  setSelectedSubtasks(subtasks: Subtask[]): void {
    this.selectedSubtasks.set(sortSubtasks(subtasks));
  }

  /**
   * Replaces the assigned contacts of the selected task.
   *
   * @param contacts - Assigned contacts to store.
   */
  setAssignedContacts(contacts: Contact[]): void {
    this.assignedContacts.set(contacts);
  }

  /**
   * Updates subtask state when the provided task is currently selected.
   *
   * @param taskId - Identifier of the related task.
   * @param subtasks - Subtasks to store.
   */
  setSubtasksForTask(taskId: string, subtasks: Subtask[]): void {
    if (this.selectedTask()?.id === taskId) {
      this.setSelectedSubtasks(subtasks);
    }
  }

  /**
   * Updates assignment state when the provided task is currently selected.
   *
   * @param taskId - Identifier of the related task.
   * @param contacts - Assigned contacts to store.
   */
  setContactsForTask(taskId: string, contacts: Contact[]): void {
    if (this.selectedTask()?.id === taskId) {
      this.setAssignedContacts(contacts);
    }
  }

  /**
   * Adds and selects a created task together with its loaded relations.
   *
   * @param task - Newly created task.
   * @param subtasks - Subtasks created for the task.
   * @param contacts - Contacts assigned to the task.
   */
  applyCreatedTask(task: Task, subtasks: Subtask[], contacts: Contact[]): void {
    this.addTask(task);
    this.selectTask(task);
    this.setSelectedSubtasks(subtasks);
    this.setAssignedContacts(contacts);
  }

  /**
   * Applies a task update and any submitted relation state.
   *
   * @param task - Updated task.
   * @param subtasks - Updated subtasks or undefined when unchanged.
   * @param contacts - Updated assignments or undefined when unchanged.
   */
  applyUpdatedTask(
    task: Task,
    subtasks?: Subtask[],
    contacts?: Contact[],
  ): void {
    this.updateTask(task);

    if (this.selectedTask()?.id !== task.id) {
      return;
    }

    this.applyOptionalRelations(subtasks, contacts);
  }

  /**
   * Adds a task to the local collection and restores sort order.
   *
   * @param task - Task to add.
   */
  addTask(task: Task): void {
    this.allTasks.update((tasks) => sortTasks([...tasks, task]));
  }

  /**
   * Replaces an existing task in the collection and current selection.
   *
   * @param updatedTask - Persisted task containing the latest values.
   */
  updateTask(updatedTask: Task): void {
    this.allTasks.update((tasks) => replaceTask(tasks, updatedTask));

    if (this.selectedTask()?.id === updatedTask.id) {
      this.selectTask(updatedTask);
    }
  }

  /**
   * Applies multiple persisted task updates by identifier.
   *
   * @param updatedTasks - Tasks containing updated positions or values.
   */
  applyTaskUpdates(updatedTasks: Task[]): void {
    const updatesById = new Map(updatedTasks.map((task) => [task.id, task]));
    this.allTasks.update((tasks) => {
      return sortTasks(tasks.map((task) => updatesById.get(task.id) ?? task));
    });

    const selectedTask = this.selectedTask();
    const selectedUpdate = updatesById.get(selectedTask?.id ?? '');

    if (selectedUpdate) {
      this.selectTask(selectedUpdate);
    }
  }

  /**
   * Removes a task and clears the selection when it references that task.
   *
   * @param taskId - Identifier of the task to remove.
   */
  removeTask(taskId: string): void {
    this.allTasks.update((tasks) => {
      return tasks.filter((task) => task.id !== taskId);
    });

    if (this.selectedTask()?.id === taskId) {
      this.clearSelection();
    }
  }

  /**
   * Clears the selected task and all of its relation state.
   */
  clearSelection(): void {
    this.selectTask(null);
    this.setSelectedSubtasks([]);
    this.setAssignedContacts([]);
  }

  /**
   * Adds a subtask when it belongs to the selected task.
   *
   * @param subtask - Subtask to add.
   */
  addSubtask(subtask: Subtask): void {
    if (this.selectedTask()?.id !== subtask.taskId) {
      return;
    }

    this.selectedSubtasks.update((subtasks) => {
      return sortSubtasks([...subtasks, subtask]);
    });
  }

  /**
   * Replaces a subtask in the selected subtask state.
   *
   * @param updatedSubtask - Persisted subtask containing the latest values.
   */
  updateSubtask(updatedSubtask: Subtask): void {
    this.selectedSubtasks.update((subtasks) => {
      return replaceSubtask(subtasks, updatedSubtask);
    });
  }

  /**
   * Removes a subtask from the selected subtask state.
   *
   * @param subtaskId - Identifier of the subtask to remove.
   */
  removeSubtask(subtaskId: string): void {
    this.selectedSubtasks.update((subtasks) => {
      return subtasks.filter((subtask) => subtask.id !== subtaskId);
    });
  }

  /**
   * Applies relation values that were included in a task update.
   *
   * @param subtasks - Updated subtasks or undefined when unchanged.
   * @param contacts - Updated assignments or undefined when unchanged.
   */
  private applyOptionalRelations(
    subtasks?: Subtask[],
    contacts?: Contact[],
  ): void {
    if (subtasks !== undefined) {
      this.setSelectedSubtasks(subtasks);
    }

    if (contacts !== undefined) {
      this.setAssignedContacts(contacts);
    }
  }
}