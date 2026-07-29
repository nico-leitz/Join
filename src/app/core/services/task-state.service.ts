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

@Injectable({
  providedIn: 'root',
})
export class TaskStateService {
  readonly allTasks = signal<Task[]>([]);
  readonly selectedTask = signal<Task | null>(null);
  readonly selectedSubtasks = signal<Subtask[]>([]);
  readonly assignedContacts = signal<Contact[]>([]);

  setTasks(tasks: Task[]): void {
    this.allTasks.set(sortTasks(tasks));
  }

  selectTask(task: Task | null): void {
    this.selectedTask.set(task);
  }

  setSelectedSubtasks(subtasks: Subtask[]): void {
    this.selectedSubtasks.set(sortSubtasks(subtasks));
  }

  setAssignedContacts(contacts: Contact[]): void {
    this.assignedContacts.set(contacts);
  }

  setSubtasksForTask(taskId: string, subtasks: Subtask[]): void {
    if (this.selectedTask()?.id === taskId) {
      this.setSelectedSubtasks(subtasks);
    }
  }

  setContactsForTask(taskId: string, contacts: Contact[]): void {
    if (this.selectedTask()?.id === taskId) {
      this.setAssignedContacts(contacts);
    }
  }

  applyCreatedTask(task: Task, subtasks: Subtask[], contacts: Contact[]): void {
    this.addTask(task);
    this.selectTask(task);
    this.setSelectedSubtasks(subtasks);
    this.setAssignedContacts(contacts);
  }

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

  addTask(task: Task): void {
    this.allTasks.update((tasks) => sortTasks([...tasks, task]));
  }

  updateTask(updatedTask: Task): void {
    this.allTasks.update((tasks) => replaceTask(tasks, updatedTask));

    if (this.selectedTask()?.id === updatedTask.id) {
      this.selectTask(updatedTask);
    }
  }

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

  removeTask(taskId: string): void {
    this.allTasks.update((tasks) => {
      return tasks.filter((task) => task.id !== taskId);
    });

    if (this.selectedTask()?.id === taskId) {
      this.clearSelection();
    }
  }

  clearSelection(): void {
    this.selectTask(null);
    this.setSelectedSubtasks([]);
    this.setAssignedContacts([]);
  }

  addSubtask(subtask: Subtask): void {
    if (this.selectedTask()?.id !== subtask.taskId) {
      return;
    }

    this.selectedSubtasks.update((subtasks) => {
      return sortSubtasks([...subtasks, subtask]);
    });
  }

  updateSubtask(updatedSubtask: Subtask): void {
    this.selectedSubtasks.update((subtasks) => {
      return replaceSubtask(subtasks, updatedSubtask);
    });
  }

  removeSubtask(subtaskId: string): void {
    this.selectedSubtasks.update((subtasks) => {
      return subtasks.filter((subtask) => subtask.id !== subtaskId);
    });
  }

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
