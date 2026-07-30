import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { Board } from './board';
import { TaskService } from '../../../../core/services/task.service';
import { ContactService } from '../../../../core/services/contact.service';
import { BoardHorizontalScrollService } from '../../services/board-horizontal-scroll.service';
import { Task, TaskPositionUpdate } from '../../../../core/models/task.model';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { TaskAssignmentRow } from '../../../../core/models/task-assignment.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskDialogUpdate } from '../../components/board-cards-dialog/board-cards-dialog';

/**
 * @description Unit tests for the Board component.
 * Verifies initialization loading states, task filtering, subtask/contact mapping,
 * drag-and-drop operations, context menu actions, and dialog interactions.
 */
describe('Board Component', () => {
  let component: Board;
  let fixture: ComponentFixture<Board>;
  let router: Router;
  let mockTaskService: any;
  let mockContactService: any;
  let mockScrollService: any;

  /** Mock task data spanning different statuses. */
  const MOCK_TASKS: Task[] = [
    {
      id: 'task-1',
      title: 'Setup Environment',
      description: 'Install dependencies',
      category: 'technical_task',
      priority: 'urgent',
      status: 'todo',
      dueDate: '2026-07-30',
      sortOrder: 0,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'task-2',
      title: 'Design UI',
      description: 'Create Figma prototypes',
      category: 'user_story',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2026-08-01',
      sortOrder: 1,
      createdAt: '',
      updatedAt: ''
    }
  ];

  /** Mock contacts data for assignment mapping. */
  const MOCK_CONTACTS: Contact[] = [
    {
      id: 'c-1',
      firstName: 'Alice',
      lastName: 'Adams',
      email: 'alice@example.com',
      phone: '',
      badgeColor: '#ff0000',
      authUserId: '',
      createdAt: '',
      updatedAt: ''
    }
  ];

  /** Mock subtasks data. */
  const MOCK_SUBTASKS: Subtask[] = [
    {
      id: 'sub-1',
      taskId: 'task-1',
      title: 'NPM Install',
      isCompleted: true,
      sortOrder: 0,
      createdAt: '',
      updatedAt: ''
    }
  ];

  /** Mock relational assignments linking tasks and contacts. */
  const MOCK_ASSIGNMENTS: TaskAssignmentRow[] = [
    {
      task_id: 'task-1',
      contact_id: 'c-1',
      created_at: ''
    }
  ];

  beforeEach(async () => {
    mockTaskService = {
      allTasks: signal([...MOCK_TASKS]),
      selectedTask: signal<Task | null>(null),
      selectedSubtasks: signal<Subtask[]>([]),
      assignedContacts: signal<Contact[]>([]),
      getTasks: vi.fn().mockResolvedValue([...MOCK_TASKS]),
      loadAllBoardData: vi.fn().mockResolvedValue({
        subtasks: [...MOCK_SUBTASKS],
        assignments: [...MOCK_ASSIGNMENTS]
      }),
      updateTaskPositions: vi.fn().mockResolvedValue(true)
    };

    mockContactService = {
      allContacts: signal([...MOCK_CONTACTS]),
      getContacts: vi.fn().mockResolvedValue([...MOCK_CONTACTS])
    };

    mockScrollService = {
      isMobileViewport: signal(false),
      dropListOrientation: signal('horizontal'),
      start: vi.fn(),
      move: vi.fn(),
      end: vi.fn(),
      updateViewport: vi.fn(),
      consumeSuppressedCardClick: vi.fn().mockReturnValue(false)
    };

    await TestBed.configureTestingModule({
      imports: [Board],
      providers: [
        provideRouter([]),
        { provide: TaskService, useValue: mockTaskService },
        { provide: ContactService, useValue: mockContactService }
      ]
    })
    .overrideComponent(Board, {
      remove: { providers: [BoardHorizontalScrollService] },
      add: { providers: [{ provide: BoardHorizontalScrollService, useValue: mockScrollService }] }
    })
    .compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Board);
    component = fixture.componentInstance;
    
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test Ensures the component creates successfully and loads initial board data.
   */
  it('should create the component and load board data on init', () => {
    expect(component).toBeTruthy();
    expect(mockTaskService.getTasks).toHaveBeenCalled();
    expect(mockTaskService.loadAllBoardData).toHaveBeenCalled();
    expect(mockContactService.getContacts).toHaveBeenCalled();
    expect(component.allSubtasks().length).toBe(1);
    expect(component.allAssignments().length).toBe(1);
  });

  /**
   * @test Verifies error handling when the initial data load fails.
   */
  it('should set an error message if loading board data fails', async () => {
    mockTaskService.getTasks.mockRejectedValueOnce(new Error('Network Error'));
    
    await component.loadBoard();

    expect(component.boardError()).toBe('Board data could not be loaded.');
    expect(component.isBoardLoading()).toBe(false);
  });

  /**
   * @test Validates the computed task status categories reflect the underlying data.
   */
  it('should compute task columns correctly based on status', () => {
    expect(component.todo().length).toBe(1);
    expect(component.todo()[0].title).toBe('Setup Environment');
    
    expect(component.inProgress().length).toBe(1);
    expect(component.inProgress()[0].title).toBe('Design UI');
    
    expect(component.awaitFeedback().length).toBe(0);
    expect(component.done().length).toBe(0);
  });

  /**
   * @test Verifies that the search term filters tasks appropriately across all columns.
   */
  it('should filter tasks globally when search term is updated', () => {
    const mockInputEvent = { target: { value: 'Design' } } as unknown as Event;
    
    component.updateSearchTerm(mockInputEvent);
    
    expect(component.searchTerm()).toBe('Design');
    expect(component.todo().length).toBe(0);
    expect(component.inProgress().length).toBe(1);
    expect(component.isSearchActive()).toBe(true);
  });

  /**
   * @test Ensures that the relationship mapping resolves the correct subtasks for a given task ID.
   */
  it('should resolve mapped subtasks for a given task ID', () => {
    const subtasks = component.getSubtasksForTask('task-1');
    expect(subtasks.length).toBe(1);
    expect(subtasks[0].title).toBe('NPM Install');
    
    const emptySubtasks = component.getSubtasksForTask('unknown-task');
    expect(emptySubtasks.length).toBe(0);
  });

  /**
   * @test Ensures that the relationship mapping resolves the assigned contacts for a given task ID.
   */
  it('should resolve mapped assigned contacts for a given task ID', () => {
    const contacts = component.getContactsForTask('task-1');
    expect(contacts.length).toBe(1);
    expect(contacts[0].firstName).toBe('Alice');
    
    const emptyContacts = component.getContactsForTask('task-2');
    expect(emptyContacts.length).toBe(0);
  });

  /**
   * @test Verifies opening the add task dialog strictly sets states in desktop mode.
   */
  it('should open the Add Task dialog on desktop viewports', () => {
    mockScrollService.isMobileViewport.set(false);
    
    component.openAddTaskDialog('in_progress');
    
    expect(component.addTaskStatus()).toBe('in_progress');
    expect(component.isAddTaskDialogOpen()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  /**
   * @test Verifies routing to the standalone add task page in mobile viewports.
   */
  it('should navigate to the add-task route on mobile viewports', () => {
    mockScrollService.isMobileViewport.set(true);
    
    component.openAddTaskDialog('done');
    
    expect(router.navigate).toHaveBeenCalledWith(['/add-task'], { queryParams: { status: 'done' } });
    expect(component.isAddTaskDialogOpen()).toBe(false);
  });

  /**
   * @test Blocks opening the add task dialog if the board is actively updating to prevent state conflicts.
   */
  it('should not open Add Task dialog if board is updating', () => {
    component['isBoardUpdating'].set(true);
    
    component.openAddTaskDialog('todo');
    
    expect(component.isAddTaskDialogOpen()).toBe(false);
  });

  /**
   * @test Validates cleanup operations upon closing the Add Task dialog.
   */
  it('should close the Add Task dialog and clear selected task states', () => {
    component['isAddTaskDialogOpen'].set(true);
    mockTaskService.selectedTask.set(MOCK_TASKS[0]);
    
    component.closeAddTaskDialog();
    
    expect(component.isAddTaskDialogOpen()).toBe(false);
    expect(mockTaskService.selectedTask()).toBeNull();
  });

  /**
   * @test Ensures that a successful task creation trigger refetches relational board data.
   */
  it('should refresh board relations when a task is created', async () => {
    component['isAddTaskDialogOpen'].set(true);
    
    await component.handleTaskCreated();
    
    expect(component.isAddTaskDialogOpen()).toBe(false);
    expect(mockTaskService.loadAllBoardData).toHaveBeenCalledTimes(2);
    expect(mockTaskService.selectedTask()).toBeNull();
  });

  /**
   * @test Verifies that the task dialog opens and binds all related state globally and locally.
   */
  it('should open the task dialog and set current state if not suppressed by scroll service', () => {
    component.openDialog(MOCK_TASKS[0]);
    
    expect(component.isDialogOpen()).toBe(true);
    expect(component.dialogTask()).toEqual(MOCK_TASKS[0]);
    expect(component.dialogSubtasks().length).toBe(1);
    expect(component.dialogContacts().length).toBe(1);
    expect(mockTaskService.selectedTask()).toEqual(MOCK_TASKS[0]);
  });

  /**
   * @test Verifies scroll service integration correctly suppresses unintended dialog opens during swipe gestures.
   */
  it('should abort opening the task dialog if suppressed by horizontal scroll service', () => {
    mockScrollService.consumeSuppressedCardClick.mockReturnValue(true);
    
    component.openDialog(MOCK_TASKS[0]);
    
    expect(component.isDialogOpen()).toBe(false);
    expect(component.dialogTask()).toBeNull();
  });

  /**
   * @test Verifies the internal subtask array updating logic handles changes correctly without a full reload.
   */
  it('should cleanly replace an updated subtask in local arrays without refetching', () => {
    const updatedSubtask: Subtask = { ...MOCK_SUBTASKS[0], title: 'Yarn Install', isCompleted: false };
    
    component.dialogSubtasks.set([...MOCK_SUBTASKS]);
    
    component.handleSubtaskUpdated(updatedSubtask);
    
    const localAll = component.allSubtasks().find(s => s.id === 'sub-1');
    const localDialog = component.dialogSubtasks().find(s => s.id === 'sub-1');
    
    expect(localAll?.title).toBe('Yarn Install');
    expect(localAll?.isCompleted).toBe(false);
    expect(localDialog?.title).toBe('Yarn Install');
  });

  /**
   * @test Ensures task deletion filters out orphans in the local relational stores.
   */
  it('should wipe orphans from local arrays when a task is deleted', () => {
    component.handleTaskDeleted('task-1');
    
    expect(component.allSubtasks().some(s => s.taskId === 'task-1')).toBe(false);
    expect(component.allAssignments().some(a => a.task_id === 'task-1')).toBe(false);
  });

  /**
   * @test Tests successful relational data refresh upon a task being updated inside the dialog.
   */
  it('should handle a dialog task update, set local signals, and refresh relationships', async () => {
    const dialogUpdate: TaskDialogUpdate = {
      task: { ...MOCK_TASKS[0], title: 'Refactored' },
      subtasks: [],
      assignedContacts: []
    };
    
    await component.handleTaskUpdated(dialogUpdate);
    
    expect(component.dialogTask()?.title).toBe('Refactored');
    expect(component.dialogSubtasks().length).toBe(0);
    expect(component.dialogContacts().length).toBe(0);
    expect(mockTaskService.loadAllBoardData).toHaveBeenCalledTimes(2); 
    expect(component.boardError()).toBe('');
  });

  /**
   * @test Asserts that failing to refresh relations after an update displays the correct error.
   */
  it('should show an error if refreshing relations fails after a task update', async () => {
    const dialogUpdate: TaskDialogUpdate = { task: MOCK_TASKS[0], subtasks: [], assignedContacts: [] };
    
    mockTaskService.loadAllBoardData.mockRejectedValueOnce(new Error('Fail'));
    
    await component.handleTaskUpdated(dialogUpdate);
    
    expect(component.boardError()).toBe('Task was saved, but the board could not be refreshed completely.');
  });

  /**
   * @test Validates pointer down events delegate immediately to the scroll service.
   */
  it('should delegate horizontal pointer down events to scroll service', () => {
    const event = new PointerEvent('pointerdown');
    component['onHorizontalPointerDown'](event);
    expect(mockScrollService.start).toHaveBeenCalledWith(event, false);
  });

  /**
   * @test Validates pointer move events delegate immediately to the scroll service.
   */
  it('should delegate horizontal pointer move events to scroll service', () => {
    const event = new PointerEvent('pointermove');
    component['onHorizontalPointerMove'](event);
    expect(mockScrollService.move).toHaveBeenCalledWith(event);
  });

  /**
   * @test Validates pointer up/cancel events delegate immediately to the scroll service.
   */
  it('should delegate horizontal pointer end events to scroll service', () => {
    const event = new PointerEvent('pointerup');
    component['onHorizontalPointerEnd'](event);
    expect(mockScrollService.end).toHaveBeenCalledWith(event);
  });

  /**
   * @test Ensures that the drag state indicators function correctly.
   */
  it('should correctly set isDragging boolean states', () => {
    component['startDragging']();
    expect(component.isDragging()).toBe(true);

    component['stopDragging']();
    expect(component.isDragging()).toBe(false);
  });

  /**
   * @test Tests context menu triggered status move workflow.
   */
  it('should generate position updates and trigger persistence when a task is moved via context menu', async () => {
    await component['moveTaskToStatus'](MOCK_TASKS[0], 'done');
    
    expect(mockTaskService.updateTaskPositions).toHaveBeenCalled();
    expect(component.isBoardUpdating()).toBe(false);
  });

  /**
   * @test Blocks context menu moves while the board is already processing an update.
   */
  it('should abort context menu move if the board is already updating', async () => {
    component['isBoardUpdating'].set(true);
    
    await component['moveTaskToStatus'](MOCK_TASKS[0], 'done');
    
    expect(mockTaskService.updateTaskPositions).not.toHaveBeenCalled();
  });

  /**
   * @test Verifies that drag and drop events create updates and trigger backend synchronization.
   */
  it('should process cdkDragDrop events successfully', async () => {
    const mockDropEvent = {
      previousContainer: { id: 'todo' },
      container: { id: 'in_progress' },
      previousIndex: 0,
      currentIndex: 0
    } as CdkDragDrop<Task[]>;

    await component.drop(mockDropEvent);

    expect(mockTaskService.updateTaskPositions).toHaveBeenCalled();
  });

  /**
   * @test Aborts drop operations immediately if dragging is functionally disabled (e.g., active search).
   */
  it('should abort drop event if dragging is disabled', async () => {
    component.searchTerm.set('Design');
    
    const mockDropEvent = {} as CdkDragDrop<Task[]>;
    await component.drop(mockDropEvent);

    expect(mockTaskService.updateTaskPositions).not.toHaveBeenCalled();
  });

  /**
   * @test Ensures that a persistence failure during drag/drop logs an error and attempts to resync from the backend.
   */
  it('should gracefully handle update errors during drag and drop by triggering a reload', async () => {
    const mockDropEvent = {
      previousContainer: { id: 'todo' },
      container: { id: 'in_progress' },
      previousIndex: 0,
      currentIndex: 0
    } as CdkDragDrop<Task[]>;

    mockTaskService.updateTaskPositions.mockRejectedValueOnce(new Error('Update Failed'));

    await component.drop(mockDropEvent);

    expect(component.boardError()).toBe('Task positions could not be saved.');
    expect(mockTaskService.getTasks).toHaveBeenCalledTimes(2); 
    expect(component.isBoardUpdating()).toBe(false);
  });
});