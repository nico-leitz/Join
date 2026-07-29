import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { TaskAssignmentRow } from '../../../../core/models/task-assignment.model';
import {
  Task,
  TaskPositionUpdate,
  TaskStatus,
} from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';
import {
  filterTasksBySearchTerm,
  filterTasksByStatus,
} from '../../../../core/utils/task-filter.utils';
import {
  createDropTaskUpdates,
  createStatusMoveTaskUpdates,
} from '../../../../core/utils/task-order.utils';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { AddTaskDialog } from '../../../add-task/components/add-task-dialog/add-task-dialog';
import {
  BoardCardsDialog,
  TaskDialogUpdate,
} from '../../components/board-cards-dialog/board-cards-dialog';
import { TaskCard } from '../../components/task-card/task-card';
import { BoardHorizontalScrollService } from '../../services/board-horizontal-scroll.service';
import {
  createContactMap,
  groupContactIdsByTaskId,
  groupSubtasksByTaskId,
  replaceBoardSubtask,
} from '../../utils/board-data.utils';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    Header,
    Sidebar,
    TaskCard,
    AddTaskDialog,
    BoardCardsDialog,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
  ],
  providers: [BoardHorizontalScrollService],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  host: {
    '(window:resize)': 'onWindowResize()',
    '(pointerdown)':
      'onHorizontalPointerDown($event)',
    '(pointermove)':
      'onHorizontalPointerMove($event)',
    '(pointerup)':
      'onHorizontalPointerEnd($event)',
    '(pointercancel)':
      'onHorizontalPointerEnd($event)',
  },
})
export class Board implements OnInit {
  private readonly taskService =
    inject(TaskService);
  private readonly contactService =
    inject(ContactService);
  private readonly horizontalScroll = inject(
    BoardHorizontalScrollService,
  );
  private readonly router = inject(Router);

  readonly isDialogOpen = signal(false);
  readonly isAddTaskDialogOpen = signal(false);
  readonly addTaskStatus =
    signal<TaskStatus>('todo');
  readonly isBoardLoading = signal(false);
  readonly isBoardUpdating = signal(false);
  readonly isDragging = signal(false);
  readonly boardError = signal('');
  readonly searchTerm = signal('');
  readonly allSubtasks = signal<Subtask[]>([]);
  readonly allAssignments =
    signal<TaskAssignmentRow[]>([]);
  readonly allContacts =
    this.contactService.allContacts;
  readonly dialogTask = signal<Task | null>(
    null,
  );
  readonly dialogSubtasks = signal<Subtask[]>(
    [],
  );
  readonly dialogContacts = signal<Contact[]>(
    [],
  );

  protected readonly isMobileViewport =
    this.horizontalScroll.isMobileViewport;
  protected readonly dropListOrientation =
    this.horizontalScroll.dropListOrientation;

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
    return (
      this.searchTerm().trim().length > 0
    );
  });

  readonly isDragDisabled = computed(() => {
    return (
      this.isSearchActive() ||
      this.isBoardUpdating()
    );
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
    this.searchTerm.set(
      (event.target as HTMLInputElement).value,
    );
  }

  getSubtasksForTask(taskId: string): Subtask[] {
    return (
      this.subtasksByTaskId().get(taskId) ?? []
    );
  }

  getContactsForTask(taskId: string): Contact[] {
    const contactIds =
      this.contactIdsByTaskId().get(taskId) ??
      [];
    const contactsById = this.contactsById();

    return contactIds.flatMap((id) => {
      const contact = contactsById.get(id);
      return contact ? [contact] : [];
    });
  }

  openAddTaskDialog(
    status: TaskStatus = 'todo',
  ): void {
    if (this.isBoardUpdating()) {
      return;
    }

    if (this.isMobileViewport()) {
      void this.router.navigate(['/add-task'], {
        queryParams: { status },
      });
      return;
    }

    this.addTaskStatus.set(status);
    this.isAddTaskDialogOpen.set(true);
  }

  closeAddTaskDialog(): void {
    this.isAddTaskDialogOpen.set(false);
    this.clearTaskSelectionState();
  }

  async handleTaskCreated(): Promise<void> {
    this.isAddTaskDialogOpen.set(false);
    this.boardError.set('');

    try {
      await this.refreshBoardRelations();
    } catch {
      this.boardError.set(
        'Task was created, but the board could not be refreshed completely.',
      );
    } finally {
      this.clearTaskSelectionState();
    }
  }

  openDialog(task: Task): void {
    if (
      this.horizontalScroll.consumeSuppressedCardClick()
    ) {
      return;
    }

    const subtasks = this.getSubtasksForTask(
      task.id,
    );
    const contacts = this.getContactsForTask(
      task.id,
    );

    this.dialogTask.set(task);
    this.dialogSubtasks.set(subtasks);
    this.dialogContacts.set(contacts);
    this.taskService.selectedTask.set(task);
    this.taskService.selectedSubtasks.set(
      subtasks,
    );
    this.taskService.assignedContacts.set(
      contacts,
    );
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
    this.dialogTask.set(null);
    this.dialogSubtasks.set([]);
    this.dialogContacts.set([]);
    this.clearTaskSelectionState();
  }

  handleSubtaskUpdated(
    updatedSubtask: Subtask,
  ): void {
    this.allSubtasks.update((subtasks) => {
      return replaceBoardSubtask(
        subtasks,
        updatedSubtask,
      );
    });

    this.dialogSubtasks.update((subtasks) => {
      return replaceBoardSubtask(
        subtasks,
        updatedSubtask,
      );
    });
  }

  handleTaskDeleted(taskId: string): void {
    this.allSubtasks.update((subtasks) => {
      return subtasks.filter(
        (subtask) =>
          subtask.taskId !== taskId,
      );
    });

    this.allAssignments.update(
      (assignments) => {
        return assignments.filter(
          (assignment) =>
            assignment.task_id !== taskId,
        );
      },
    );
  }

  async handleTaskUpdated(
    update: TaskDialogUpdate,
  ): Promise<void> {
    this.dialogTask.set(update.task);
    this.dialogSubtasks.set(update.subtasks);
    this.dialogContacts.set(
      update.assignedContacts,
    );
    this.boardError.set('');

    try {
      await this.refreshBoardRelations();
    } catch (error) {
      console.error(
        'Task was saved, but board relations could not be refreshed.',
        error,
      );
      this.boardError.set(
        'Task was saved, but the board could not be refreshed completely.',
      );
    }
  }

  protected startDragging(): void {
    this.isDragging.set(true);
  }

  protected stopDragging(): void {
    this.isDragging.set(false);
  }

  protected onWindowResize(): void {
    this.horizontalScroll.updateViewport();
  }

  protected onHorizontalPointerDown(
    event: PointerEvent,
  ): void {
    this.horizontalScroll.start(
      event,
      this.isDragging(),
    );
  }

  protected onHorizontalPointerMove(
    event: PointerEvent,
  ): void {
    this.horizontalScroll.move(event);
  }

  protected onHorizontalPointerEnd(
    event: PointerEvent,
  ): void {
    this.horizontalScroll.end(event);
  }

  protected async moveTaskToStatus(
    task: Task,
    targetStatus: TaskStatus,
  ): Promise<void> {
    if (this.isBoardUpdating()) {
      return;
    }

    const updates =
      createStatusMoveTaskUpdates(
        this.taskService.allTasks(),
        task.id,
        targetStatus,
      );

    await this.persistTaskUpdates(updates);
  }

  async drop(
    event: CdkDragDrop<Task[]>,
  ): Promise<void> {
    if (this.isDragDisabled()) {
      return;
    }

    const updates = createDropTaskUpdates(
      this.taskService.allTasks(),
      {
        sourceStatus:
          event.previousContainer
            .id as TaskStatus,
        targetStatus:
          event.container.id as TaskStatus,
        sourceIndex: event.previousIndex,
        targetIndex: event.currentIndex,
      },
    );

    await this.persistTaskUpdates(updates);
  }

  private async loadBoardContent():
    Promise<void> {
    const [, boardData, contacts] =
      await Promise.all([
        this.taskService.getTasks(),
        this.taskService.loadAllBoardData(),
        this.contactService.getContacts(),
      ]);

    this.allSubtasks.set(boardData.subtasks);
    this.allAssignments.set(
      boardData.assignments,
    );
    this.allContacts.set(contacts);
  }

  private async refreshBoardRelations():
    Promise<void> {
    const boardData =
      await this.taskService.loadAllBoardData();

    this.allSubtasks.set(boardData.subtasks);
    this.allAssignments.set(
      boardData.assignments,
    );
  }

  private clearTaskSelectionState(): void {
    this.taskService.selectedTask.set(null);
    this.taskService.selectedSubtasks.set(
      [],
    );
    this.taskService.assignedContacts.set(
      [],
    );
  }

  private async persistTaskUpdates(
    updates: TaskPositionUpdate[],
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    this.isBoardUpdating.set(true);
    this.boardError.set('');

    try {
      await this.taskService.updateTaskPositions(
        updates,
      );
    } catch (error) {
      await this.handleTaskUpdateError(error);
    } finally {
      this.isBoardUpdating.set(false);
    }
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
}