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
import { Router } from '@angular/router';
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
import { AddTaskDialog } from '../../../add-task/components/add-task-dialog/add-task-dialog';
import {
  BoardCardsDialog,
  TaskDialogUpdate,
} from '../../components/board-cards-dialog/board-cards-dialog';
import { TaskCard } from '../../components/task-card/task-card';

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
  private readonly horizontalLayoutMaxWidth =
    798;

  private readonly horizontalMoveThreshold =
    5;

  private readonly taskService =
    inject(TaskService);

  private readonly contactService =
    inject(ContactService);

  private readonly router =
    inject(Router);

  private horizontalScrollElement:
    HTMLElement | null = null;

  private horizontalScrollPointerId:
    number | null = null;

  private horizontalScrollStartX = 0;
  private horizontalScrollStartLeft = 0;
  private horizontalScrollMoved = false;
  private horizontalPointerCaptured = false;
  private suppressNextCardClick = false;

  readonly isDialogOpen =
    signal(false);

  readonly isAddTaskDialogOpen =
    signal(false);

  readonly addTaskStatus =
    signal<TaskStatus>('todo');

  readonly isBoardLoading =
    signal(false);

  readonly isBoardUpdating =
    signal(false);

  readonly isDragging =
    signal(false);

  readonly boardError =
    signal('');

  readonly searchTerm =
    signal('');

  protected readonly isMobileViewport =
    signal(this.getIsMobileViewport());

  readonly allSubtasks =
    signal<Subtask[]>([]);

  readonly allAssignments =
    signal<TaskAssignmentRow[]>([]);

  readonly allContacts =
    this.contactService.allContacts;

  readonly dialogTask =
    signal<Task | null>(null);

  readonly dialogSubtasks =
    signal<Subtask[]>([]);

  readonly dialogContacts =
    signal<Contact[]>([]);

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
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  getSubtasksForTask(
    taskId: string,
  ): Subtask[] {
    return (
      this.subtasksByTaskId().get(taskId) ??
      []
    );
  }

  getContactsForTask(
    taskId: string,
  ): Contact[] {
    const contactIds =
      this.contactIdsByTaskId().get(
        taskId,
      ) ?? [];

    return this.getContactsByIds(
      contactIds,
    );
  }

  openAddTaskDialog(
    status: TaskStatus = 'todo',
  ): void {
    if (this.isBoardUpdating()) {
      return;
    }

    if (this.isMobileViewport()) {
      this.openMobileAddTaskPage(status);
      return;
    }

    this.addTaskStatus.set(status);
    this.isAddTaskDialogOpen.set(true);
  }

  closeAddTaskDialog(): void {
    this.isAddTaskDialogOpen.set(false);
    this.clearTaskSelectionState();
  }

  async handleTaskCreated():
    Promise<void> {
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
    if (this.suppressNextCardClick) {
      this.suppressNextCardClick = false;
      return;
    }

    const subtasks =
      this.getSubtasksForTask(task.id);

    const contacts =
      this.getContactsForTask(task.id);

    this.dialogTask.set(task);
    this.dialogSubtasks.set(subtasks);
    this.dialogContacts.set(contacts);

    this.taskService.selectedTask.set(
      task,
    );

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
    this.allSubtasks.update(
      (subtasks) => {
        return replaceSubtask(
          subtasks,
          updatedSubtask,
        );
      },
    );

    this.dialogSubtasks.update(
      (subtasks) => {
        return replaceSubtask(
          subtasks,
          updatedSubtask,
        );
      },
    );
  }

  handleTaskDeleted(taskId: string): void {
    this.allSubtasks.update(
      (subtasks) => {
        return subtasks.filter(
          (subtask) => {
            return (
              subtask.taskId !== taskId
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

  async handleTaskUpdated(
    update: TaskDialogUpdate,
  ): Promise<void> {
    this.dialogTask.set(update.task);

    this.dialogSubtasks.set(
      update.subtasks,
    );

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
    this.isMobileViewport.set(
      this.getIsMobileViewport(),
    );

    if (!this.isMobileViewport()) {
      this.resetHorizontalScroll();
    }
  }

  protected onHorizontalPointerDown(
    event: PointerEvent,
  ): void {
    if (
      !this.canStartHorizontalScroll(event)
    ) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (this.isInteractiveTarget(target)) {
      return;
    }

    const scrollElement =
      target.closest<HTMLElement>(
        '.board__column_content',
      );

    if (
      !scrollElement ||
      scrollElement.scrollWidth <=
        scrollElement.clientWidth
    ) {
      return;
    }

    this.horizontalScrollElement =
      scrollElement;

    this.horizontalScrollPointerId =
      event.pointerId;

    this.horizontalScrollStartX =
      event.clientX;

    this.horizontalScrollStartLeft =
      scrollElement.scrollLeft;

    this.horizontalScrollMoved = false;
    this.horizontalPointerCaptured = false;
  }

  protected onHorizontalPointerMove(
    event: PointerEvent,
  ): void {
    if (
      !this.horizontalScrollElement ||
      this.horizontalScrollPointerId !==
        event.pointerId
    ) {
      return;
    }

    const distance =
      event.clientX -
      this.horizontalScrollStartX;

    if (
      !this.horizontalScrollMoved &&
      Math.abs(distance) <
        this.horizontalMoveThreshold
    ) {
      return;
    }

    if (!this.horizontalScrollMoved) {
      this.startHorizontalMouseScroll(
        event,
      );
    }

    event.preventDefault();

    this.horizontalScrollElement.scrollLeft =
      this.horizontalScrollStartLeft -
      distance;
  }

  protected onHorizontalPointerEnd(
    event: PointerEvent,
  ): void {
    if (
      !this.horizontalScrollElement ||
      this.horizontalScrollPointerId !==
        event.pointerId
    ) {
      return;
    }

    if (this.horizontalScrollMoved) {
      this.suppressNextCardClick = true;

      window.setTimeout(() => {
        this.suppressNextCardClick = false;
      });
    }

    this.releaseHorizontalPointer(event);
    this.resetHorizontalScroll();
  }

  protected async moveTaskToStatus(
    task: Task,
    targetStatus: TaskStatus,
  ): Promise<void> {
    if (
      task.status === targetStatus ||
      this.isBoardUpdating()
    ) {
      return;
    }

    const updatedTasks =
      this.createStatusMoveUpdates(
        task,
        targetStatus,
      );

    await this.persistTaskUpdates(
      updatedTasks,
    );
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

    await this.persistTaskUpdates(
      updatedTasks,
    );
  }

  private openMobileAddTaskPage(
    status: TaskStatus,
  ): void {
    void this.router.navigate(
      ['/add-task'],
      {
        queryParams: {
          status,
        },
      },
    );
  }

  private startHorizontalMouseScroll(
    event: PointerEvent,
  ): void {
    if (!this.horizontalScrollElement) {
      return;
    }

    this.horizontalScrollMoved = true;

    this.horizontalScrollElement
      .classList.add(
        'board__column_content--mouse-dragging',
      );

    this.horizontalScrollElement
      .setPointerCapture(event.pointerId);

    this.horizontalPointerCaptured = true;
  }

  private canStartHorizontalScroll(
    event: PointerEvent,
  ): boolean {
    return (
      this.isMobileViewport() &&
      event.pointerType === 'mouse' &&
      event.button === 0 &&
      !this.isDragging()
    );
  }

  private isInteractiveTarget(
    target: Element,
  ): boolean {
    return Boolean(
      target.closest(
        'button, input, select, textarea, a, label',
      ),
    );
  }

  private releaseHorizontalPointer(
    event: PointerEvent,
  ): void {
    if (
      !this.horizontalScrollElement ||
      !this.horizontalPointerCaptured
    ) {
      return;
    }

    if (
      this.horizontalScrollElement
        .hasPointerCapture(event.pointerId)
    ) {
      this.horizontalScrollElement
        .releasePointerCapture(
          event.pointerId,
        );
    }
  }

  private resetHorizontalScroll(): void {
    this.horizontalScrollElement
      ?.classList.remove(
        'board__column_content--mouse-dragging',
      );

    this.horizontalScrollElement = null;
    this.horizontalScrollPointerId = null;
    this.horizontalScrollStartX = 0;
    this.horizontalScrollStartLeft = 0;
    this.horizontalScrollMoved = false;
    this.horizontalPointerCaptured = false;
  }

  private async loadBoardContent():
    Promise<void> {
    const [, boardData, contacts] =
      await Promise.all([
        this.taskService.getTasks(),
        this.taskService
          .loadAllBoardData(),
        this.contactService
          .getContacts(),
      ]);

    this.allSubtasks.set(
      boardData.subtasks,
    );

    this.allAssignments.set(
      boardData.assignments,
    );

    this.allContacts.set(contacts);
  }

  private async refreshBoardRelations():
    Promise<void> {
    const boardData =
      await this.taskService
        .loadAllBoardData();

    this.allSubtasks.set(
      boardData.subtasks,
    );

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

  private getContactsByIds(
    contactIds: string[],
  ): Contact[] {
    const contactsById =
      this.contactsById();

    return contactIds.flatMap(
      (contactId) => {
        const contact =
          contactsById.get(contactId);

        return contact
          ? [contact]
          : [];
      },
    );
  }

  private moveDroppedTask(
    event: CdkDragDrop<Task[]>,
  ): void {
    if (
      event.previousContainer ===
      event.container
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
    const targetTasks =
      this.normalizeColumnTasks(
        event.container.data,
        this.getTaskStatus(
          event.container.id,
        ),
      );

    if (
      event.previousContainer ===
      event.container
    ) {
      return this.getChangedTasks(
        targetTasks,
      );
    }

    const sourceTasks =
      this.normalizeColumnTasks(
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

  private createStatusMoveUpdates(
    task: Task,
    targetStatus: TaskStatus,
  ): Task[] {
    const sourceTasks =
      this.getTasksByStatusWithoutTask(
        task.status,
        task.id,
      );

    const targetTasks =
      this.getTasksByStatusWithoutTask(
        targetStatus,
        task.id,
      );

    const movedTask: Task = {
      ...task,
      status: targetStatus,
      sortOrder: targetTasks.length,
    };

    const normalizedSource =
      this.normalizeColumnTasks(
        sourceTasks,
        task.status,
      );

    const normalizedTarget =
      this.normalizeColumnTasks(
        [
          ...targetTasks,
          movedTask,
        ],
        targetStatus,
      );

    return this.getChangedTasks([
      ...normalizedSource,
      ...normalizedTarget,
    ]);
  }

  private getTasksByStatusWithoutTask(
    status: TaskStatus,
    excludedTaskId: string,
  ): Task[] {
    return this.taskService
      .allTasks()
      .filter((task) => {
        return (
          task.status === status &&
          task.id !== excludedTaskId
        );
      })
      .sort(
        (
          firstTask,
          secondTask,
        ) => {
          return (
            firstTask.sortOrder -
            secondTask.sortOrder
          );
        },
      );
  }

  private normalizeColumnTasks(
    tasks: Task[],
    status: TaskStatus,
  ): Task[] {
    return tasks.map(
      (task, index) => {
        return {
          ...task,
          status,
          sortOrder: index,
        };
      },
    );
  }

  private getChangedTasks(
    updatedTasks: Task[],
  ): Task[] {
    const currentTasks = new Map(
      this.taskService
        .allTasks()
        .map((task) => {
          return [
            task.id,
            task,
          ];
        }),
    );

    return updatedTasks.filter(
      (task) => {
        return this.hasTaskChanged(
          currentTasks.get(task.id),
          task,
        );
      },
    );
  }

  private hasTaskChanged(
    currentTask: Task | undefined,
    updatedTask: Task,
  ): boolean {
    return (
      currentTask !== undefined &&
      (
        currentTask.status !==
          updatedTask.status ||
        currentTask.sortOrder !==
          updatedTask.sortOrder
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
      await this.updateTasks(
        updatedTasks,
      );
    } catch (error) {
      await this.handleTaskUpdateError(
        error,
      );
    } finally {
      this.isBoardUpdating.set(false);
    }
  }

  private async updateTasks(
    updatedTasks: Task[],
  ): Promise<void> {
    await Promise.all(
      updatedTasks.map((task) => {
        return this.taskService
          .updateTask(
            task.id,
            {
              status: task.status,
              sortOrder:
                task.sortOrder,
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

  private getIsMobileViewport(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.innerWidth <=
        this.horizontalLayoutMaxWidth
    );
  }
}

function groupSubtasksByTaskId(
  subtasks: Subtask[],
): Map<string, Subtask[]> {
  const groupedSubtasks =
    new Map<string, Subtask[]>();

  for (const subtask of subtasks) {
    const taskSubtasks =
      groupedSubtasks.get(
        subtask.taskId,
      ) ?? [];

    groupedSubtasks.set(
      subtask.taskId,
      [
        ...taskSubtasks,
        subtask,
      ],
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
      [
        ...contactIds,
        assignment.contact_id,
      ],
    );
  }

  return groupedContactIds;
}

function createContactMap(
  contacts: Contact[],
): Map<string, Contact> {
  return new Map(
    contacts.map((contact) => {
      return [
        contact.id,
        contact,
      ];
    }),
  );
}

function replaceSubtask(
  subtasks: Subtask[],
  updatedSubtask: Subtask,
): Subtask[] {
  return subtasks.map((subtask) => {
    return (
      subtask.id ===
      updatedSubtask.id
    )
      ? updatedSubtask
      : subtask;
  });
}