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
import {
  Task,
  TaskStatus,
} from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { AddTaskDialog } from '../../../add-task/components/add-task-dialog/add-task-dialog';
import {
  BoardCardsDialog,
  TaskDialogUpdate,
} from '../../components/board-cards-dialog/board-cards-dialog';
import { TaskCard } from '../../components/task-card/task-card';
import { BoardDataStateService } from '../../services/board-data-state.service';
import { BoardDialogStateService } from '../../services/board-dialog-state.service';
import { BoardHorizontalScrollService } from '../../services/board-horizontal-scroll.service';
import { BoardRouteService } from '../../services/board-route.service';
import { BoardTaskPositionService } from '../../services/board-task-position.service';

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
  providers: [
    BoardDataStateService,
    BoardDialogStateService,
    BoardHorizontalScrollService,
    BoardRouteService,
    BoardTaskPositionService,
  ],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  host: {
    '(window:resize)':
      'horizontalScroll.updateViewport()',
    '(pointerdown)':
      'horizontalScroll.start($event, isDragging())',
    '(pointermove)':
      'horizontalScroll.move($event)',
    '(pointerup)':
      'horizontalScroll.end($event)',
    '(pointercancel)':
      'horizontalScroll.end($event)',
  },
})
export class Board implements OnInit {
  private readonly taskService = inject(TaskService);

  private readonly boardData = inject(
    BoardDataStateService,
  );

  private readonly dialogState = inject(
    BoardDialogStateService,
  );

  protected readonly horizontalScroll = inject(
    BoardHorizontalScrollService,
  );

  private readonly boardRoute = inject(
    BoardRouteService,
  );

  private readonly taskPosition = inject(
    BoardTaskPositionService,
  );

  private readonly router = inject(Router);

  readonly isDialogOpen =
    this.dialogState.isOpen;

  readonly isAddTaskDialogOpen = signal(false);

  readonly addTaskStatus =
    signal<TaskStatus>('todo');

  readonly isBoardLoading = signal(false);

  readonly isBoardUpdating =
    this.taskPosition.isUpdating;

  readonly isDragging = signal(false);

  readonly boardError = signal('');

  readonly searchTerm =
    this.boardData.searchTerm;

  readonly allSubtasks =
    this.boardData.allSubtasks;

  readonly allAssignments =
    this.boardData.allAssignments;

  readonly allContacts =
    this.boardData.allContacts;

  readonly dialogTask =
    this.dialogState.task;

  readonly dialogSubtasks =
    this.dialogState.subtasks;

  readonly dialogContacts =
    this.dialogState.contacts;

  protected readonly isMobileViewport =
    this.horizontalScroll.isMobileViewport;

  protected readonly dropListOrientation =
    this.horizontalScroll.dropListOrientation;

  readonly filteredTasks =
    this.boardData.filteredTasks;

  readonly todo = this.boardData.todo;

  readonly inProgress =
    this.boardData.inProgress;

  readonly awaitFeedback =
    this.boardData.awaitFeedback;

  readonly done = this.boardData.done;

  readonly isSearchActive =
    this.boardData.isSearchActive;

  readonly isDragDisabled = computed(() => {
    return (
      this.isSearchActive() ||
      this.isBoardUpdating()
    );
  });

  async ngOnInit(): Promise<void> {
    await this.loadBoard();
  }

  async loadBoard(): Promise<void> {
    this.isBoardLoading.set(true);
    this.boardError.set('');

    try {
      await this.boardData.load();
      this.openRequestedTaskDialog();
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

      this.boardRoute
        .scheduleRequestedStatusScroll();
    }
  }

  updateSearchTerm(event: Event): void {
    this.searchTerm.set(
      (event.target as HTMLInputElement).value,
    );
  }

  getSubtasksForTask(
    taskId: string,
  ): Subtask[] {
    return this.boardData.getSubtasks(taskId);
  }

  getContactsForTask(
    taskId: string,
  ): Contact[] {
    return this.boardData.getContacts(taskId);
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
    this.dialogState.clearSelection();
  }

  async handleTaskCreated(): Promise<void> {
    this.isAddTaskDialogOpen.set(false);
    this.boardError.set('');

    try {
      await this.boardData.refreshRelations();
    } catch {
      this.boardError.set(
        'Task was created, but the board could not be refreshed completely.',
      );
    } finally {
      this.dialogState.clearSelection();
    }
  }

  openDialog(task: Task): void {
    if (
      this.horizontalScroll
        .consumeSuppressedCardClick()
    ) {
      return;
    }

    const subtasks = this.getSubtasksForTask(
      task.id,
    );

    const contacts = this.getContactsForTask(
      task.id,
    );

    this.dialogState.open(
      task,
      subtasks,
      contacts,
    );
  }

  closeDialog(): void {
    this.dialogState.close();
    this.boardRoute.clearRequestedTask();
  }

  handleSubtaskUpdated(
    updatedSubtask: Subtask,
  ): void {
    this.boardData.updateSubtask(
      updatedSubtask,
    );

    this.dialogState.updateSubtask(
      updatedSubtask,
    );
  }

  handleTaskDeleted(taskId: string): void {
    this.boardData.removeTaskRelations(taskId);
  }

  async handleTaskUpdated(
    update: TaskDialogUpdate,
  ): Promise<void> {
    this.dialogState.update(
      update.task,
      update.subtasks,
      update.assignedContacts,
    );

    this.boardError.set('');

    try {
      await this.boardData.refreshRelations();
    } catch (error) {
      this.handleRelationRefreshError(error);
    }
  }

  protected startDragging(): void {
    this.isDragging.set(true);
  }

  protected stopDragging(): void {
    this.isDragging.set(false);
  }

  protected async moveTaskToStatus(
    task: Task,
    targetStatus: TaskStatus,
  ): Promise<void> {
    this.boardError.set('');

    const error =
      await this.taskPosition.moveToStatus(
        task,
        targetStatus,
      );

    this.boardError.set(error);
  }

  async drop(
    event: CdkDragDrop<Task[]>,
  ): Promise<void> {
    if (this.isDragDisabled()) {
      return;
    }

    this.boardError.set('');

    const error =
      await this.taskPosition.moveFromDrop(
        event,
      );

    this.boardError.set(error);
  }

  private openRequestedTaskDialog(): void {
    const taskId =
      this.boardRoute.getRequestedTaskId();

    if (!taskId) {
      return;
    }

    const task = this.taskService
      .allTasks()
      .find((item) => item.id === taskId);

    if (!task) {
      this.boardError.set(
        'Requested task could not be found.',
      );

      return;
    }

    this.openDialog(task);
  }

  private handleRelationRefreshError(
    error: unknown,
  ): void {
    console.error(
      'Task was saved, but board relations could not be refreshed.',
      error,
    );

    this.boardError.set(
      'Task was saved, but the board could not be refreshed completely.',
    );
  }
}