import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { Task, TaskStatus } from '../../../../core/models/task.model';
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

/**
 * Displays and coordinates the task board.
 *
 * Connects board data, dialogs, routing, horizontal scrolling and task
 * position persistence without owning their implementation details.
 */
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
    '(window:resize)': 'horizontalScroll.updateViewport()',
    '(pointerdown)': 'horizontalScroll.start($event, isDragging())',
    '(pointermove)': 'horizontalScroll.move($event)',
    '(pointerup)': 'horizontalScroll.end($event)',
    '(pointercancel)': 'horizontalScroll.end($event)',
  },
})
export class Board implements OnInit {
  /** Service exposing the complete application task collection. */
  private readonly taskService = inject(TaskService);

  /** Board-specific task, relation and search state. */
  private readonly boardData = inject(BoardDataStateService);

  /** State of the task detail dialog and its current selection. */
  private readonly dialogState = inject(BoardDialogStateService);

  /** Pointer-based horizontal board scrolling behavior. */
  protected readonly horizontalScroll = inject(BoardHorizontalScrollService);

  /** Board query parameter and requested scroll behavior. */
  private readonly boardRoute = inject(BoardRouteService);

  /** Task drag-and-drop and mobile move behavior. */
  private readonly taskPosition = inject(BoardTaskPositionService);

  /** Router used to open the standalone mobile task page. */
  private readonly router = inject(Router);

  /** Indicates whether the task detail dialog is open. */
  readonly isDialogOpen = this.dialogState.isOpen;

  /** Indicates whether the desktop add-task dialog is open. */
  readonly isAddTaskDialogOpen = signal(false);

  /** Initial status supplied to the add-task dialog or page. */
  readonly addTaskStatus = signal<TaskStatus>('todo');

  /** Indicates whether the complete board is being loaded. */
  readonly isBoardLoading = signal(false);

  /** Indicates whether task positions are being persisted. */
  readonly isBoardUpdating = this.taskPosition.isUpdating;

  /** Indicates whether a CDK task drag is active. */
  readonly isDragging = signal(false);

  /** User-facing message describing the latest board failure. */
  readonly boardError = signal('');

  /** Current task search term. */
  readonly searchTerm = this.boardData.searchTerm;

  /** Complete subtask collection used by task cards. */
  readonly allSubtasks = this.boardData.allSubtasks;

  /** Complete assignment row collection used by task cards. */
  readonly allAssignments = this.boardData.allAssignments;

  /** Complete contact collection available to the board. */
  readonly allContacts = this.boardData.allContacts;

  /** Task currently displayed by the detail dialog. */
  readonly dialogTask = this.dialogState.task;

  /** Subtasks displayed by the detail dialog. */
  readonly dialogSubtasks = this.dialogState.subtasks;

  /** Contacts displayed by the detail dialog. */
  readonly dialogContacts = this.dialogState.contacts;

  /** Indicates whether the mobile board layout is active. */
  protected readonly isMobileViewport = this.horizontalScroll.isMobileViewport;

  /** Orientation supplied to the CDK drop lists. */
  protected readonly dropListOrientation = this.horizontalScroll.dropListOrientation;

  /** Tasks matching the current search term. */
  readonly filteredTasks = this.boardData.filteredTasks;

  /** Filtered tasks in the to-do column. */
  readonly todo = this.boardData.todo;

  /** Filtered tasks in the in-progress column. */
  readonly inProgress = this.boardData.inProgress;

  /** Filtered tasks in the awaiting-feedback column. */
  readonly awaitFeedback = this.boardData.awaitFeedback;

  /** Filtered tasks in the done column. */
  readonly done = this.boardData.done;

  /** Indicates whether a non-empty board search is active. */
  readonly isSearchActive = this.boardData.isSearchActive;

  /** Indicates whether drag-and-drop must currently be disabled. */
  readonly isDragDisabled = computed(() => {
    return this.isSearchActive() || this.isBoardUpdating();
  });

  /**
   * Loads the initial board state.
   * @returns A promise that resolves after initialization.
   */
  async ngOnInit(): Promise<void> {
    await this.loadBoard();
  }

  /**
   * Loads tasks, relations and contacts and handles route requests.
   * @returns A promise that resolves after the load attempt.
   */
  async loadBoard(): Promise<void> {
    this.isBoardLoading.set(true);
    this.boardError.set('');

    try {
      await this.boardData.load();

      this.openRequestedTaskDialog();
    } catch (error) {
      console.error('Board data could not be loaded.', error);

      this.boardError.set('Board data could not be loaded.');
    } finally {
      this.isBoardLoading.set(false);

      this.boardRoute.scheduleRequestedStatusScroll();
    }
  }

  /**
   * Applies the current search input value to board state.
   * @param event - Search input event containing the current value.
   */
  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  /**
   * Returns the subtasks belonging to a task.
   * @param taskId - Identifier of the requested task.
   * @returns Subtasks belonging to the task.
   */
  getSubtasksForTask(taskId: string): Subtask[] {
    return this.boardData.getSubtasks(taskId);
  }

  /**
   * Returns the contacts assigned to a task.
   * @param taskId - Identifier of the requested task.
   * @returns Contacts assigned to the task.
   */
  getContactsForTask(taskId: string): Contact[] {
    return this.boardData.getContacts(taskId);
  }

  /**
   * Opens task creation in the layout-appropriate UI.
   * @param status - Initial status of the task to create.
   */
  openAddTaskDialog(status: TaskStatus = 'todo'): void {
    if (this.isBoardUpdating()) {
      return;
    }

    if (this.isMobileViewport()) {
      void this.router.navigate(['/add-task'], { queryParams: { status } });

      return;
    }

    this.addTaskStatus.set(status);

    this.isAddTaskDialogOpen.set(true);
  }

  /**
   * Closes task creation and clears shared task selection state.
   */
  closeAddTaskDialog(): void {
    this.isAddTaskDialogOpen.set(false);

    this.dialogState.clearSelection();
  }

  /**
   * Closes task creation and refreshes board relations after creation.
   * @returns A promise that resolves after the refresh attempt.
   */
  async handleTaskCreated(): Promise<void> {
    this.isAddTaskDialogOpen.set(false);

    this.boardError.set('');

    try {
      await this.boardData.refreshRelations();
    } catch {
      this.boardError.set('Task was created, but the board could not be refreshed completely.');
    } finally {
      this.dialogState.clearSelection();
    }
  }

  /**
   * Opens a task unless the click belongs to horizontal mouse scrolling.
   * @param task - Task selected by the user.
   */
  openDialog(task: Task): void {
    if (this.horizontalScroll.consumeSuppressedCardClick()) {
      return;
    }

    this.dialogState.open(task, this.getSubtasksForTask(task.id), this.getContactsForTask(task.id));
  }

  /**
   * Closes the task dialog and removes its task query parameter.
   */
  closeDialog(): void {
    this.dialogState.close();

    this.boardRoute.clearRequestedTask();
  }

  /**
   * Synchronizes a changed subtask with board and dialog state.
   * @param updatedSubtask - Persisted subtask containing the new state.
   */
  handleSubtaskUpdated(updatedSubtask: Subtask): void {
    this.boardData.updateSubtask(updatedSubtask);

    this.dialogState.updateSubtask(updatedSubtask);
  }

  /**
   * Removes local relation state belonging to a deleted task.
   * @param taskId - Identifier of the deleted task.
   */
  handleTaskDeleted(taskId: string): void {
    this.boardData.removeTaskRelations(taskId);
  }

  /**
   * Synchronizes the dialog and reloads board relations after a task update.
   * @param update - Complete task and relation state emitted by the dialog.
   * @returns A promise that resolves after the refresh attempt.
   */
  async handleTaskUpdated(update: TaskDialogUpdate): Promise<void> {
    this.dialogState.update(update.task, update.subtasks, update.assignedContacts);

    this.boardError.set('');

    try {
      await this.boardData.refreshRelations();
    } catch (error) {
      this.handleRelationRefreshError(error);
    }
  }

  /**
   * Marks a CDK task drag as active.
   */
  protected startDragging(): void {
    this.isDragging.set(true);
  }

  /**
   * Marks the current CDK task drag as finished.
   */
  protected stopDragging(): void {
    this.isDragging.set(false);
  }

  /**
   * Moves a task to the selected status through the mobile move menu.
   * @param task - Task to move.
   * @param targetStatus - Status of the target board column.
   * @returns A promise that resolves after the persistence attempt.
   */
  protected async moveTaskToStatus(task: Task, targetStatus: TaskStatus): Promise<void> {
    this.boardError.set('');

    const error = await this.taskPosition.moveToStatus(task, targetStatus);

    this.boardError.set(error);
  }

  /**
   * Instantly updates local data for smooth optimistic UI drag-and-drop animation,
   * then persists the new task position to the backend.
   * @param event - Drop event containing source and target positions.
   * @returns A promise that resolves after the persistence attempt.
   */
  async drop(event: CdkDragDrop<Task[]>): Promise<void> {
    if (this.isDragDisabled()) {
      return;
    }

    this.boardError.set('');

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    const error = await this.taskPosition.moveFromDrop(event);

    this.boardError.set(error);
  }

  /**
   * Opens the task requested through the current route.
   */
  private openRequestedTaskDialog(): void {
    const taskId = this.boardRoute.getRequestedTaskId();

    if (!taskId) {
      return;
    }

    const task = this.taskService.allTasks().find((item) => {
      return item.id === taskId;
    });

    if (!task) {
      this.boardError.set('Requested task could not be found.');

      return;
    }

    this.openDialog(task);
  }

  /**
   * Logs and exposes a relation refresh failure after a successful save.
   * @param error - Original relation loading error.
   */
  private handleRelationRefreshError(error: unknown): void {
    console.error('Task was saved, but board relations could not be refreshed.', error);

    this.boardError.set('Task was saved, but the board could not be refreshed completely.');
  }
}