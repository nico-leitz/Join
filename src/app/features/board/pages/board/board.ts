import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { TaskAssignmentRow } from '../../../../core/models/task-assignment.model';
import {
  Task,
  TaskStatus,
} from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';
import {
  filterTasksBySearchTerm,
  filterTasksByStatus,
} from '../../../../core/utils/task-filter.utils';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { BoardCardsDialog } from '../../components/board-cards-dialog/board-cards-dialog';
import { TaskCard } from '../../components/task-card/task-card';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    Header,
    Sidebar,
    TaskCard,
    BoardCardsDialog,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly contactService = inject(ContactService);

  readonly isDialogOpen = signal(false);
  readonly isBoardLoading = signal(false);
  readonly isBoardUpdating = signal(false);
  readonly boardError = signal('');
  readonly searchTerm = signal('');

  readonly allSubtasks = signal<Subtask[]>([]);
  readonly allAssignments = signal<TaskAssignmentRow[]>([]);
  readonly allContacts = this.contactService.allContacts;

  readonly dialogTask = signal<Task | null>(null);
  readonly dialogSubtasks = signal<Subtask[]>([]);
  readonly dialogContacts = signal<Contact[]>([]);

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

  readonly isDragDisabled = computed(() => {
    return (
      this.isSearchActive() ||
      this.isBoardUpdating()
    );
  });

  private readonly subtasksByTaskId = computed(() => {
    return groupSubtasksByTaskId(
      this.allSubtasks(),
    );
  });

  private readonly contactIdsByTaskId = computed(() => {
    return groupContactIdsByTaskId(
      this.allAssignments(),
    );
  });

  private readonly contactsById = computed(() => {
    return createContactMap(
      this.allContacts(),
    );
  });

  async ngOnInit(): Promise<void> {
    await this.loadBoard();
  }

  async loadBoard(): Promise<void> {
    this.isBoardLoading.set(true);
    this.boardError.set('');

    try {
      await this.loadBoardContent();
    } catch (error) {
      console.error(
        'Board data could not be loaded.',
        error,
      );

      this.boardError.set(
        'Board data could not be loaded.',
      );
    } finally {
      this.isBoardLoading.set(false);
    }
  }

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  getSubtasksForTask(taskId: string): Subtask[] {
    return (
      this.subtasksByTaskId().get(taskId) ?? []
    );
  }

  getContactsForTask(taskId: string): Contact[] {
    const contactIds =
      this.contactIdsByTaskId().get(taskId) ?? [];

    return this.getContactsByIds(contactIds);
  }

  openDialog(task: Task): void {
    const subtasks = this.getSubtasksForTask(task.id);
    const contacts = this.getContactsForTask(task.id);

    this.dialogTask.set(task);
    this.dialogSubtasks.set(subtasks);
    this.dialogContacts.set(contacts);

    this.taskService.selectedTask.set(task);
    this.taskService.selectedSubtasks.set(subtasks);
    this.taskService.assignedContacts.set(contacts);

    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
    this.dialogTask.set(null);
    this.dialogSubtasks.set([]);
    this.dialogContacts.set([]);

    this.taskService.selectedTask.set(null);
    this.taskService.selectedSubtasks.set([]);
    this.taskService.assignedContacts.set([]);
  }

  handleSubtaskUpdated(
    updatedSubtask: Subtask,
  ): void {
    this.allSubtasks.update((subtasks) => {
      return replaceSubtask(
        subtasks,
        updatedSubtask,
      );
    });

    this.dialogSubtasks.update((subtasks) => {
      return replaceSubtask(
        subtasks,
        updatedSubtask,
      );
    });
  }

  handleTaskDeleted(taskId: string): void {
    this.allSubtasks.update((subtasks) => {
      return subtasks.filter((subtask) => {
        return subtask.taskId !== taskId;
      });
    });

    this.allAssignments.update((assignments) => {
      return assignments.filter((assignment) => {
        return assignment.task_id !== taskId;
      });
    });
  }

  async drop(
    event: CdkDragDrop<Task[]>,
  ): Promise<void> {
    if (this.isDragDisabled()) {
      return;
    }

    this.moveDroppedTask(event);

    const updatedTasks =
      this.createDropUpdates(event);

    await this.persistTaskUpdates(updatedTasks);
  }

  private async loadBoardContent(): Promise<void> {
    const [, boardData, contacts] =
      await Promise.all([
        this.taskService.getTasks(),
        this.taskService.loadAllBoardData(),
        this.contactService.getContacts(),
      ]);

    this.allSubtasks.set(boardData.subtasks);
    this.allAssignments.set(boardData.assignments);
    this.allContacts.set(contacts);
  }

  private getContactsByIds(
    contactIds: string[],
  ): Contact[] {
    const contactsById = this.contactsById();

    return contactIds.flatMap((contactId) => {
      const contact = contactsById.get(contactId);

      return contact ? [contact] : [];
    });
  }

  private moveDroppedTask(
    event: CdkDragDrop<Task[]>,
  ): void {
    if (
      event.previousContainer === event.container
    ) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
  }

  private createDropUpdates(
    event: CdkDragDrop<Task[]>,
  ): Task[] {
    const targetTasks = this.normalizeColumnTasks(
      event.container.data,
      this.getTaskStatus(event.container.id),
    );

    if (
      event.previousContainer === event.container
    ) {
      return this.getChangedTasks(targetTasks);
    }

    const sourceTasks = this.normalizeColumnTasks(
      event.previousContainer.data,
      this.getTaskStatus(
        event.previousContainer.id,
      ),
    );

    return this.getChangedTasks([
      ...sourceTasks,
      ...targetTasks,
    ]);
  }

  private normalizeColumnTasks(
    tasks: Task[],
    status: TaskStatus,
  ): Task[] {
    return tasks.map((task, index) => {
      return {
        ...task,
        status,
        sortOrder: index,
      };
    });
  }

  private getChangedTasks(
    updatedTasks: Task[],
  ): Task[] {
    const currentTasks = new Map(
      this.taskService.allTasks().map((task) => {
        return [task.id, task];
      }),
    );

    return updatedTasks.filter((task) => {
      return this.hasTaskChanged(
        currentTasks.get(task.id),
        task,
      );
    });
  }

  private hasTaskChanged(
    currentTask: Task | undefined,
    updatedTask: Task,
  ): boolean {
    return (
      currentTask !== undefined &&
      (
        currentTask.status !== updatedTask.status ||
        currentTask.sortOrder !== updatedTask.sortOrder
      )
    );
  }

  private async persistTaskUpdates(
    updatedTasks: Task[],
  ): Promise<void> {
    if (updatedTasks.length === 0) {
      return;
    }

    this.isBoardUpdating.set(true);
    this.boardError.set('');

    try {
      await this.updateTasks(updatedTasks);
    } catch (error) {
      await this.handleTaskUpdateError(error);
    } finally {
      this.isBoardUpdating.set(false);
    }
  }

  private async updateTasks(
    updatedTasks: Task[],
  ): Promise<void> {
    await Promise.all(
      updatedTasks.map((task) => {
        return this.taskService.updateTask(
          task.id,
          {
            status: task.status,
            sortOrder: task.sortOrder,
          },
        );
      }),
    );
  }

  private async handleTaskUpdateError(
    error: unknown,
  ): Promise<void> {
    console.error(
      'Task positions could not be saved.',
      error,
    );

    this.boardError.set(
      'Task positions could not be saved.',
    );

    try {
      await this.taskService.getTasks();
    } catch (reloadError) {
      console.error(
        'Tasks could not be reloaded.',
        reloadError,
      );
    }
  }

  private getTaskStatus(
    containerId: string,
  ): TaskStatus {
    return containerId as TaskStatus;
  }
}

function groupSubtasksByTaskId(
  subtasks: Subtask[],
): Map<string, Subtask[]> {
  const groupedSubtasks =
    new Map<string, Subtask[]>();

  for (const subtask of subtasks) {
    const taskSubtasks =
      groupedSubtasks.get(subtask.taskId) ?? [];

    groupedSubtasks.set(
      subtask.taskId,
      [...taskSubtasks, subtask],
    );
  }

  return groupedSubtasks;
}

function groupContactIdsByTaskId(
  assignments: TaskAssignmentRow[],
): Map<string, string[]> {
  const groupedContactIds =
    new Map<string, string[]>();

  for (const assignment of assignments) {
    const contactIds =
      groupedContactIds.get(
        assignment.task_id,
      ) ?? [];

    groupedContactIds.set(
      assignment.task_id,
      [...contactIds, assignment.contact_id],
    );
  }

  return groupedContactIds;
}

function createContactMap(
  contacts: Contact[],
): Map<string, Contact> {
  return new Map(
    contacts.map((contact) => {
      return [contact.id, contact];
    }),
  );
}

function replaceSubtask(
  subtasks: Subtask[],
  updatedSubtask: Subtask,
): Subtask[] {
  return subtasks.map((subtask) => {
    return subtask.id === updatedSubtask.id
      ? updatedSubtask
      : subtask;
  });
}