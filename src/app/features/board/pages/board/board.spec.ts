import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Task, TaskStatus } from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';
import { TaskDialogUpdate } from '../../components/board-cards-dialog/board-cards-dialog';
import { BoardHorizontalScrollService } from '../../services/board-horizontal-scroll.service';
import { Board } from './board';
import {
  ContactServiceMock,
  MOCK_SUBTASKS,
  MOCK_TASKS,
  ScrollServiceMock,
  TaskServiceMock,
  createContactServiceMock,
  createDropEvent,
  createScrollServiceMock,
  createTaskServiceMock,
} from './board-test.utils';

/** Protected board surface exercised by focused unit tests. */
interface BoardTestAccess {
  /** Marks a task drag as active. */
  startDragging(): void;

  /** Marks a task drag as finished. */
  stopDragging(): void;

  /** Moves a task through the context menu workflow. */
  moveTaskToStatus(task: Task, targetStatus: TaskStatus): Promise<void>;
}

let component: Board;
let fixture: ComponentFixture<Board>;
let router: Router;
let taskService: TaskServiceMock;
let contactService: ContactServiceMock;
let scrollService: ScrollServiceMock;

/** Configures the board testing module and scroll-service override. */
async function configureTestBed(): Promise<void> {
  // prettier-ignore
  const providers = [provideRouter([]), { provide: TaskService, useValue: taskService }, { provide: ContactService, useValue: contactService }];
  await TestBed.configureTestingModule({
    imports: [Board],
    providers,
  })
    .overrideComponent(Board, {
      remove: { providers: [BoardHorizontalScrollService] },
      add: { providers: [{ provide: BoardHorizontalScrollService, useValue: scrollService }] },
    })
    .compileComponents();
}

/** Creates fresh mocks and a rendered board fixture. */
async function setupComponent(): Promise<void> {
  taskService = createTaskServiceMock();
  contactService = createContactServiceMock();
  scrollService = createScrollServiceMock();
  await configureTestBed();
  router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture = TestBed.createComponent(Board);
  component = fixture.componentInstance;
  fixture.detectChanges();
}

/** Restores all spies after each board test. */
function cleanUpComponent(): void {
  vi.restoreAllMocks();
}

/**
 * Exposes protected board handlers for focused tests.
 * @returns Test-accessible board surface.
 */
function getTestAccess(): BoardTestAccess {
  return component as unknown as BoardTestAccess;
}

/** Verifies creation and initial board-data loading. */
function shouldCreateAndLoadBoard(): void {
  expect(component).toBeTruthy();
  expect(taskService.getTasks).toHaveBeenCalled();
  expect(taskService.loadAllBoardData).toHaveBeenCalled();
  expect(contactService.getContacts).toHaveBeenCalled();
  expect(component.allSubtasks()).toHaveLength(1);
  expect(component.allAssignments()).toHaveLength(1);
}

/** Verifies the board error state after initial loading fails. */
async function shouldHandleLoadFailure(): Promise<void> {
  taskService.getTasks.mockRejectedValueOnce(new Error('Network Error'));
  await component.loadBoard();
  expect(component.boardError()).toBe('Board data could not be loaded.');
  expect(component.isBoardLoading()).toBe(false);
}

/** Verifies task grouping by board status. */
function shouldComputeTaskColumns(): void {
  expect(component.todo()).toHaveLength(1);
  expect(component.todo()[0].title).toBe('Setup Environment');
  expect(component.inProgress()).toHaveLength(1);
  expect(component.inProgress()[0].title).toBe('Design UI');
  expect(component.awaitFeedback()).toHaveLength(0);
  expect(component.done()).toHaveLength(0);
}

/** Verifies global task filtering from the search input. */
function shouldFilterTasks(): void {
  const event = { target: { value: 'Design' } } as unknown as Event;
  component.updateSearchTerm(event);
  expect(component.searchTerm()).toBe('Design');
  expect(component.todo()).toHaveLength(0);
  expect(component.inProgress()).toHaveLength(1);
  expect(component.isSearchActive()).toBe(true);
}

/** Verifies subtask lookup for known and unknown tasks. */
function shouldResolveSubtasks(): void {
  const subtasks = component.getSubtasksForTask('task-1');
  expect(subtasks).toHaveLength(1);
  expect(subtasks[0].title).toBe('NPM Install');
  expect(component.getSubtasksForTask('unknown-task')).toHaveLength(0);
}

/** Verifies contact lookup for assigned and unassigned tasks. */
function shouldResolveContacts(): void {
  const contacts = component.getContactsForTask('task-1');
  expect(contacts).toHaveLength(1);
  expect(contacts[0].firstName).toBe('Alice');
  expect(component.getContactsForTask('task-2')).toHaveLength(0);
}

/** Verifies opening task creation in the desktop dialog. */
function shouldOpenDesktopAddTaskDialog(): void {
  scrollService.isMobileViewport.set(false);
  component.openAddTaskDialog('in_progress');
  expect(component.addTaskStatus()).toBe('in_progress');
  expect(component.isAddTaskDialogOpen()).toBe(true);
  expect(router.navigate).not.toHaveBeenCalled();
}

/** Verifies routing task creation to the mobile page. */
function shouldNavigateToMobileAddTask(): void {
  scrollService.isMobileViewport.set(true);
  component.openAddTaskDialog('done');
  expect(router.navigate).toHaveBeenCalledWith(['/add-task'], {
    queryParams: { status: 'done' },
  });
  expect(component.isAddTaskDialogOpen()).toBe(false);
}

/** Verifies that board updates block task creation. */
function shouldBlockAddTaskWhileUpdating(): void {
  component.isBoardUpdating.set(true);
  component.openAddTaskDialog('todo');
  expect(component.isAddTaskDialogOpen()).toBe(false);
}

/** Verifies closing task creation and clearing selection state. */
function shouldCloseAddTaskDialog(): void {
  component.isAddTaskDialogOpen.set(true);
  taskService.selectedTask.set(MOCK_TASKS[0]);
  component.closeAddTaskDialog();
  expect(component.isAddTaskDialogOpen()).toBe(false);
  expect(taskService.selectedTask()).toBeNull();
}

/** Verifies relation refresh after successful task creation. */
async function shouldRefreshAfterTaskCreation(): Promise<void> {
  component.isAddTaskDialogOpen.set(true);
  await component.handleTaskCreated();
  expect(component.isAddTaskDialogOpen()).toBe(false);
  expect(taskService.loadAllBoardData).toHaveBeenCalledTimes(2);
  expect(taskService.selectedTask()).toBeNull();
}

/** Verifies opening a task with its complete relation state. */
function shouldOpenTaskDialog(): void {
  component.openDialog(MOCK_TASKS[0]);
  expect(component.isDialogOpen()).toBe(true);
  expect(component.dialogTask()).toEqual(MOCK_TASKS[0]);
  expect(component.dialogSubtasks()).toHaveLength(1);
  expect(component.dialogContacts()).toHaveLength(1);
  expect(taskService.selectedTask()).toEqual(MOCK_TASKS[0]);
}

/** Verifies suppression of task clicks caused by horizontal scrolling. */
function shouldSuppressTaskDialog(): void {
  scrollService.consumeSuppressedCardClick.mockReturnValue(true);
  component.openDialog(MOCK_TASKS[0]);
  expect(component.isDialogOpen()).toBe(false);
  expect(component.dialogTask()).toBeNull();
}

/** Verifies local synchronization of a changed subtask. */
function shouldUpdateSubtaskLocally(): void {
  const updated = { ...MOCK_SUBTASKS[0], title: 'Yarn Install', isCompleted: false };
  component.dialogSubtasks.set([...MOCK_SUBTASKS]);
  component.handleSubtaskUpdated(updated);
  const allSubtask = component.allSubtasks().find(({ id }) => id === 'sub-1');
  const dialogSubtask = component.dialogSubtasks().find(({ id }) => id === 'sub-1');
  expect(allSubtask?.title).toBe('Yarn Install');
  expect(allSubtask?.isCompleted).toBe(false);
  expect(dialogSubtask?.title).toBe('Yarn Install');
}

/** Verifies removal of local relations after task deletion. */
function shouldRemoveDeletedTaskRelations(): void {
  component.handleTaskDeleted('task-1');
  expect(component.allSubtasks().some(({ taskId }) => taskId === 'task-1')).toBe(false);
  expect(component.allAssignments().some(({ task_id }) => task_id === 'task-1')).toBe(false);
}

/** Verifies dialog synchronization and relation refresh after an update. */
async function shouldHandleTaskUpdate(): Promise<void> {
  const update = createDialogUpdate({ ...MOCK_TASKS[0], title: 'Refactored' });
  await component.handleTaskUpdated(update);
  expect(component.dialogTask()?.title).toBe('Refactored');
  expect(component.dialogSubtasks()).toHaveLength(0);
  expect(component.dialogContacts()).toHaveLength(0);
  expect(taskService.loadAllBoardData).toHaveBeenCalledTimes(2);
  expect(component.boardError()).toBe('');
}

/** Verifies the error state when relation refresh after an update fails. */
async function shouldHandleTaskRefreshFailure(): Promise<void> {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  taskService.loadAllBoardData.mockRejectedValueOnce(new Error('Fail'));
  await component.handleTaskUpdated(createDialogUpdate(MOCK_TASKS[0]));
  expect(component.boardError()).toBe(
    'Task was saved, but the board could not be refreshed completely.',
  );
  consoleSpy.mockRestore();
}

/** Verifies active and inactive task-drag state. */
function shouldToggleDraggingState(): void {
  getTestAccess().startDragging();
  expect(component.isDragging()).toBe(true);
  getTestAccess().stopDragging();
  expect(component.isDragging()).toBe(false);
}

/** Verifies task movement through the context menu workflow. */
async function shouldMoveTaskFromContextMenu(): Promise<void> {
  await getTestAccess().moveTaskToStatus(MOCK_TASKS[0], 'done');
  expect(taskService.updateTaskPositions).toHaveBeenCalled();
  expect(component.isBoardUpdating()).toBe(false);
}

/** Verifies that an active board update blocks context-menu movement. */
async function shouldBlockContextMoveWhileUpdating(): Promise<void> {
  component.isBoardUpdating.set(true);
  await getTestAccess().moveTaskToStatus(MOCK_TASKS[0], 'done');
  expect(taskService.updateTaskPositions).not.toHaveBeenCalled();
}

/** Verifies persistence of a valid drag-and-drop operation. */
async function shouldProcessDrop(): Promise<void> {
  await component.drop(createDropEvent());
  expect(taskService.updateTaskPositions).toHaveBeenCalled();
}

/** Verifies that active search disables drag-and-drop persistence. */
async function shouldBlockDisabledDrop(): Promise<void> {
  component.searchTerm.set('Design');
  await component.drop({} as CdkDragDrop<Task[]>);
  expect(taskService.updateTaskPositions).not.toHaveBeenCalled();
}

/** Verifies recovery after drag-and-drop persistence fails. */
async function shouldRecoverFromDropFailure(): Promise<void> {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  taskService.updateTaskPositions.mockRejectedValueOnce(new Error('Update Failed'));
  await component.drop(createDropEvent());
  expect(component.boardError()).toBe('Task positions could not be saved.');
  expect(taskService.getTasks).toHaveBeenCalledTimes(2);
  expect(component.isBoardUpdating()).toBe(false);
  consoleSpy.mockRestore();
}

/**
 * Creates a task dialog update without relation entries.
 * @param task - Task included in the dialog update.
 * @returns Complete dialog update used by board tests.
 */
function createDialogUpdate(task: Task): TaskDialogUpdate {
  return { task, subtasks: [], assignedContacts: [] };
}

/** Registers initialization, filtering and relation lookup tests. */
// prettier-ignore
function registerDataTests(): void {
  it('should create the component and load board data on init', shouldCreateAndLoadBoard);
  it('should set an error message if loading board data fails', shouldHandleLoadFailure);
  it('should compute task columns correctly based on status', shouldComputeTaskColumns);
  it('should filter tasks globally when search term is updated', shouldFilterTasks);
  it('should resolve mapped subtasks for a given task ID', shouldResolveSubtasks);
  it('should resolve mapped assigned contacts for a given task ID', shouldResolveContacts);
}

/** Registers add-task and task-dialog interaction tests. */
// prettier-ignore
function registerDialogTests(): void {
  it('should open the Add Task dialog on desktop viewports', shouldOpenDesktopAddTaskDialog);
  it('should navigate to the add-task route on mobile viewports', shouldNavigateToMobileAddTask);
  it('should not open Add Task dialog if board is updating', shouldBlockAddTaskWhileUpdating);
  it('should close the Add Task dialog and clear selected task states', shouldCloseAddTaskDialog);
  it('should refresh board relations when a task is created', shouldRefreshAfterTaskCreation);
  it('should open the task dialog and set current state if not suppressed by scroll service', shouldOpenTaskDialog);
  it('should abort opening the task dialog if suppressed by horizontal scroll service', shouldSuppressTaskDialog);
}

/** Registers local relation and task-update tests. */
// prettier-ignore
function registerUpdateTests(): void {
  it('should cleanly replace an updated subtask in local arrays without refetching', shouldUpdateSubtaskLocally);
  it('should wipe orphans from local arrays when a task is deleted', shouldRemoveDeletedTaskRelations);
  it('should handle a dialog task update, set local signals, and refresh relationships', shouldHandleTaskUpdate);
  it('should show an error if refreshing relations fails after a task update', shouldHandleTaskRefreshFailure);
}

/** Registers drag state, context-menu and CDK drop tests. */
// prettier-ignore
function registerPositionTests(): void {
  it('should correctly set isDragging boolean states', shouldToggleDraggingState);
  it('should generate position updates and trigger persistence when a task is moved via context menu', shouldMoveTaskFromContextMenu);
  it('should abort context menu move if the board is already updating', shouldBlockContextMoveWhileUpdating);
  it('should process cdkDragDrop events successfully', shouldProcessDrop);
  it('should abort drop event if dragging is disabled', shouldBlockDisabledDrop);
  it('should gracefully handle update errors during drag and drop by triggering a reload', shouldRecoverFromDropFailure);
}

/** Registers the complete board component test suite. */
function registerBoardTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerDataTests();
  registerDialogTests();
  registerUpdateTests();
  registerPositionTests();
}

describe('Board Component', registerBoardTests);