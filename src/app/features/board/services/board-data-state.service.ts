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

/**
 * Owns the board-specific search and relation state.
 *
 * Loads tasks, subtasks, assignments and contacts and derives the task
 * collections rendered by each board column.
 */
@Injectable()
export class BoardDataStateService {
  /** Service used to load task and relation data. */
  private readonly taskService =
    inject(TaskService);

  /** Service used to load and expose contact data. */
  private readonly contactService =
    inject(ContactService);

  /** Complete subtask collection required by the board. */
  readonly allSubtasks =
    signal<Subtask[]>([]);

  /** Complete persisted assignment row collection. */
  readonly allAssignments =
    signal<TaskAssignmentRow[]>([]);

  /** Complete contact collection shared by the contact service. */
  readonly allContacts =
    this.contactService.allContacts;

  /** Current task search term entered on the board. */
  readonly searchTerm =
    signal('');

  /** Tasks matching the current search term. */
  readonly filteredTasks =
    computed(() => {
      return filterTasksBySearchTerm(
        this.taskService.allTasks(),
        this.searchTerm(),
      );
    });

  /** Filtered tasks belonging to the to-do column. */
  readonly todo =
    computed(() => {
      return filterTasksByStatus(
        this.filteredTasks(),
        'todo',
      );
    });

  /** Filtered tasks belonging to the in-progress column. */
  readonly inProgress =
    computed(() => {
      return filterTasksByStatus(
        this.filteredTasks(),
        'in_progress',
      );
    });

  /** Filtered tasks belonging to the awaiting-feedback column. */
  readonly awaitFeedback =
    computed(() => {
      return filterTasksByStatus(
        this.filteredTasks(),
        'awaiting_feedback',
      );
    });

  /** Filtered tasks belonging to the done column. */
  readonly done =
    computed(() => {
      return filterTasksByStatus(
        this.filteredTasks(),
        'done',
      );
    });

  /** Indicates whether a non-empty board search is active. */
  readonly isSearchActive =
    computed(() => {
      return (
        this.searchTerm()
          .trim()
          .length > 0
      );
    });

  /** Subtasks grouped by their parent task identifier. */
  private readonly subtasksByTaskId =
    computed(() => {
      return groupSubtasksByTaskId(
        this.allSubtasks(),
      );
    });

  /** Assigned contact identifiers grouped by task identifier. */
  private readonly contactIdsByTaskId =
    computed(() => {
      return groupContactIdsByTaskId(
        this.allAssignments(),
      );
    });

  /** Contacts indexed by their identifier. */
  private readonly contactsById =
    computed(() => {
      return createContactMap(
        this.allContacts(),
      );
    });

  /**
   * Loads tasks, relations and contacts required by the board.
   *
   * @returns A promise that resolves after all board state is applied.
   * @throws The loading error returned by a required service.
   */
  async load(): Promise<void> {
    const [
      ,
      boardData,
      contacts,
    ] = await Promise.all([
      this.taskService.getTasks(),
      this.taskService
        .loadAllBoardData(),
      this.contactService
        .getContacts(),
    ]);

    this.setRelations(
      boardData.subtasks,
      boardData.assignments,
    );

    this.allContacts.set(
      contacts,
    );
  }

  /**
   * Reloads subtasks and assignments after a task mutation.
   *
   * @returns A promise that resolves after relation state is applied.
   * @throws The relation loading error returned by the task service.
   */
  async refreshRelations():
    Promise<void>
  {
    const boardData =
      await this.taskService
        .loadAllBoardData();

    this.setRelations(
      boardData.subtasks,
      boardData.assignments,
    );
  }

  /**
   * Returns the subtasks belonging to a task.
   *
   * @param taskId - Identifier of the requested task.
   * @returns Subtasks belonging to the task or an empty collection.
   */
  getSubtasks(
    taskId: string,
  ): Subtask[] {
    return (
      this.subtasksByTaskId()
        .get(taskId) ?? []
    );
  }

  /**
   * Resolves the contacts assigned to a task.
   *
   * @param taskId - Identifier of the requested task.
   * @returns Existing contacts assigned to the task.
   */
  getContacts(
    taskId: string,
  ): Contact[] {
    const contactIds =
      this.contactIdsByTaskId()
        .get(taskId) ?? [];

    const contactsById =
      this.contactsById();

    return contactIds.flatMap(
      (id) => {
        const contact =
          contactsById.get(id);

        return contact
          ? [contact]
          : [];
      },
    );
  }

  /**
   * Replaces a changed subtask in the complete board state.
   *
   * @param updatedSubtask - Persisted subtask containing the new state.
   */
  updateSubtask(
    updatedSubtask: Subtask,
  ): void {
    this.allSubtasks.update(
      (subtasks) => {
        return replaceBoardSubtask(
          subtasks,
          updatedSubtask,
        );
      },
    );
  }

  /**
   * Removes local relation data belonging to a deleted task.
   *
   * @param taskId - Identifier of the deleted task.
   */
  removeTaskRelations(
    taskId: string,
  ): void {
    this.allSubtasks.update(
      (subtasks) => {
        return subtasks.filter(
          (subtask) => {
            return (
              subtask.taskId !==
              taskId
            );
          },
        );
      },
    );

    this.allAssignments.update(
      (assignments) => {
        return assignments.filter(
          (assignment) => {
            return (
              assignment.task_id !==
              taskId
            );
          },
        );
      },
    );
  }

  /**
   * Replaces all board relation state.
   *
   * @param subtasks - Complete loaded subtask collection.
   * @param assignments - Complete loaded assignment row collection.
   */
  private setRelations(
    subtasks: Subtask[],
    assignments: TaskAssignmentRow[],
  ): void {
    this.allSubtasks.set(
      subtasks,
    );

    this.allAssignments.set(
      assignments,
    );
  }
}