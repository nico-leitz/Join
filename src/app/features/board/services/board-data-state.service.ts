import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Contact } from '../../../core/models/contact.model';
import { Subtask } from '../../../core/models/subtask.model';
import { TaskAssignmentRow } from '../../../core/models/task-assignment.model';
import { ContactService } from '../../../core/services/contact.service';
import { TaskService } from '../../../core/services/task.service';
import {
  filterTasksBySearchTerm,
  filterTasksByStatus,
} from '../../../core/utils/task-filter.utils';
import {
  createContactMap,
  groupContactIdsByTaskId,
  groupSubtasksByTaskId,
  replaceBoardSubtask,
} from '../utils/board-data.utils';

@Injectable()
export class BoardDataStateService {
  private readonly taskService =
    inject(TaskService);

  private readonly contactService =
    inject(ContactService);

  readonly allSubtasks = signal<Subtask[]>([]);

  readonly allAssignments =
    signal<TaskAssignmentRow[]>([]);

  readonly allContacts =
    this.contactService.allContacts;

  readonly searchTerm = signal('');

  readonly filteredTasks = computed(() => {
    return filterTasksBySearchTerm(
      this.taskService.allTasks(),
      this.searchTerm(),
    );
  });

  readonly todo = computed(() => {
    return filterTasksByStatus(
      this.filteredTasks(),
      'todo',
    );
  });

  readonly inProgress = computed(() => {
    return filterTasksByStatus(
      this.filteredTasks(),
      'in_progress',
    );
  });

  readonly awaitFeedback = computed(() => {
    return filterTasksByStatus(
      this.filteredTasks(),
      'awaiting_feedback',
    );
  });

  readonly done = computed(() => {
    return filterTasksByStatus(
      this.filteredTasks(),
      'done',
    );
  });

  readonly isSearchActive = computed(() => {
    return this.searchTerm().trim().length > 0;
  });

  private readonly subtasksByTaskId =
    computed(() => {
      return groupSubtasksByTaskId(
        this.allSubtasks(),
      );
    });

  private readonly contactIdsByTaskId =
    computed(() => {
      return groupContactIdsByTaskId(
        this.allAssignments(),
      );
    });

  private readonly contactsById =
    computed(() => {
      return createContactMap(
        this.allContacts(),
      );
    });

  /**
   * Loads tasks and every relation required by the board.
   */
  async load(): Promise<void> {
    const [, boardData, contacts] =
      await Promise.all([
        this.taskService.getTasks(),
        this.taskService.loadAllBoardData(),
        this.contactService.getContacts(),
      ]);

    this.setRelations(
      boardData.subtasks,
      boardData.assignments,
    );

    this.allContacts.set(contacts);
  }

  /**
   * Reloads relations after a task was created or updated.
   */
  async refreshRelations(): Promise<void> {
    const boardData =
      await this.taskService.loadAllBoardData();

    this.setRelations(
      boardData.subtasks,
      boardData.assignments,
    );
  }

  /**
   * Returns the subtasks assigned to one task.
   */
  getSubtasks(taskId: string): Subtask[] {
    return (
      this.subtasksByTaskId().get(taskId) ?? []
    );
  }

  /**
   * Returns the contacts assigned to one task.
   */
  getContacts(taskId: string): Contact[] {
    const contactIds =
      this.contactIdsByTaskId().get(taskId) ??
      [];

    const contactsById = this.contactsById();

    return contactIds.flatMap((id) => {
      const contact = contactsById.get(id);

      return contact ? [contact] : [];
    });
  }

  /**
   * Replaces one changed subtask in the board state.
   */
  updateSubtask(
    updatedSubtask: Subtask,
  ): void {
    this.allSubtasks.update((subtasks) => {
      return replaceBoardSubtask(
        subtasks,
        updatedSubtask,
      );
    });
  }

  /**
   * Removes the relations belonging to a deleted task.
   */
  removeTaskRelations(taskId: string): void {
    this.allSubtasks.update((subtasks) => {
      return subtasks.filter((subtask) => {
        return subtask.taskId !== taskId;
      });
    });

    this.allAssignments.update(
      (assignments) => {
        return assignments.filter(
          (assignment) => {
            return (
              assignment.task_id !== taskId
            );
          },
        );
      },
    );
  }

  /**
   * Replaces all board relation rows.
   */
  private setRelations(
    subtasks: Subtask[],
    assignments: TaskAssignmentRow[],
  ): void {
    this.allSubtasks.set(subtasks);
    this.allAssignments.set(assignments);
  }
}