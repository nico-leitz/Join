import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { BoardCardsDialog } from './board-cards-dialog';
import { TaskService } from '../../../../core/services/task.service';
import { Task } from '../../../../core/models/task.model';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';

/**
 * @description Unit tests for the BoardCardsDialog component.
 * This suite verifies the display mode, edit mode transitions, subtask management,
 * reactive form validations, API interactions, computed signals, and DOM overlay logic.
 */
describe('BoardCardsDialog Component', () => {
  let component: BoardCardsDialog;
  let fixture: ComponentFixture<BoardCardsDialog>;
  let mockDocument: Document;
  let mockTaskService: any;

  /** Mock task data representing the current task state. */
  const MOCK_TASK: Task = {
    id: 'task-1',
    title: 'Review PRs',
    description: 'Review pending pull requests',
    category: 'technical_task',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: '2026-07-30',
    sortOrder: 0,
    createdAt: '',
    updatedAt: ''
  };

  /** Mock subtasks data. */
  const MOCK_SUBTASKS: Subtask[] = [
    { 
      id: 'sub-1', 
      taskId: 'task-1', 
      title: 'Backend PR', 
      isCompleted: false, 
      sortOrder: 0,
      createdAt: '',
      updatedAt: ''
    }
  ];

  /** Mock contacts data. */
  const MOCK_CONTACTS: Contact[] = [
    { id: 'c-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '', badgeColor: '#ff0000', authUserId: '', createdAt: '', updatedAt: '' },
    { id: 'c-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '', badgeColor: '#00ff00', authUserId: '', createdAt: '', updatedAt: '' },
    { id: 'c-3', firstName: 'Bob', lastName: 'Ross', email: 'bob@example.com', phone: '', badgeColor: '#0000ff', authUserId: '', createdAt: '', updatedAt: '' }
  ];

  beforeEach(async () => {
    mockTaskService = {
      selectedSubtasks: signal([...MOCK_SUBTASKS]),
      assignedContacts: signal([MOCK_CONTACTS[0]]),
      toggleSubtaskCompletion: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskWithRelations: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [BoardCardsDialog],
      providers: [
        { provide: TaskService, useValue: mockTaskService }
      ]
    }).compileComponents();

    mockDocument = TestBed.inject(DOCUMENT);
    mockDocument.body.style.overflow = '';
    mockDocument.documentElement.style.overflow = '';

    fixture = TestBed.createComponent(BoardCardsDialog);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('task', MOCK_TASK);
    fixture.componentRef.setInput('subtasks', MOCK_SUBTASKS);
    fixture.componentRef.setInput('availableContacts', MOCK_CONTACTS);
    fixture.componentRef.setInput('assignedContacts', [MOCK_CONTACTS[0]]);

    vi.spyOn(component.dialogClosed, 'emit');
    vi.spyOn(component.subtaskUpdated, 'emit');
    vi.spyOn(component.taskDeleted, 'emit');
    vi.spyOn(component.taskUpdated, 'emit');

    vi.useFakeTimers();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  /**
   * @test Ensures the component initializes correctly and locks the page scroll.
   */
  it('should create the component and lock page scroll on init', () => {
    expect(component).toBeTruthy();
    expect(mockDocument.body.style.overflow).toBe('hidden');
    expect(mockDocument.documentElement.style.overflow).toBe('hidden');
  });

  /**
   * @test Verifies that the previous scroll state is restored upon component destruction.
   */
  it('should restore page scroll when destroyed', () => {
    component.ngOnDestroy();
    expect(mockDocument.body.style.overflow).toBe('');
    expect(mockDocument.documentElement.style.overflow).toBe('');
  });

  /**
   * @test Checks the date formatting logic converting YYYY-MM-DD to DD/MM/YYYY.
   */
  it('should correctly format the due date for display', () => {
    expect(component.formattedDueDate()).toBe('30/07/2026');
  });

  /**
   * @test Ensures the computed category label maps correctly for technical tasks and user stories.
   */
  it('should correctly compute the categoryLabel based on task category', () => {
    expect(component.categoryLabel()).toBe('Technical Task');
    
    fixture.componentRef.setInput('task', { ...MOCK_TASK, category: 'user_story' });
    fixture.detectChanges();
    
    expect(component.categoryLabel()).toBe('User Story');
  });

  /**
   * @test Ensures the computed priority label capitalizes the first letter correctly.
   */
  it('should correctly compute and capitalize the priorityLabel', () => {
    expect(component.priorityLabel()).toBe('Urgent');

    fixture.componentRef.setInput('task', { ...MOCK_TASK, priority: 'medium' });
    fixture.detectChanges();
    expect(component.priorityLabel()).toBe('Medium');
  });

  /**
   * @test Verifies the dynamic text generated for the contact selection label.
   */
  it('should compute the correct contactSelectionLabel based on selected contacts count', () => {
    component.startEditing();
    expect(component.contactSelectionLabel()).toBe('1 contact selected');
    
    component.toggleContactSelection('c-1');
    expect(component.contactSelectionLabel()).toBe('Select contacts to assign');

    component.toggleContactSelection('c-1');
    component.toggleContactSelection('c-2');
    expect(component.contactSelectionLabel()).toBe('2 contacts selected');
  });

  /**
   * @test Ensures the close animation triggers a delayed emission of the close event.
   */
  it('should trigger closing animation and emit dialogClosed after 200ms', () => {
    component.closeDialog();
    expect(component.isClosing()).toBe(true);
    
    vi.advanceTimersByTime(200);
    expect(component.dialogClosed.emit).toHaveBeenCalled();
  });

  /**
   * @test Verifies transitioning into edit mode initializes form and local states correctly.
   */
  it('should switch to edit mode and populate form fields', () => {
    component.startEditing();
    
    expect(component.isEditing()).toBe(true);
    expect(component.editForm.controls.title.value).toBe('Review PRs');
    expect(component.editForm.controls.dueDate.value).toBe('2026-07-30');
    expect(component.selectedContactIds()).toContain('c-1');
    expect(component.editableSubtasks().length).toBe(1);
    expect(component.editableSubtasks()[0].title).toBe('Backend PR');
  });

  /**
   * @test Ensures canceling the edit mode resets the UI state correctly.
   */
  it('should revert state and hide form when cancelEditing is called', () => {
    component.startEditing();
    component.newSubtaskTitle.set('Unsaved draft');
    component.errorMessage.set('Some error');
    
    component.cancelEditing();

    expect(component.isEditing()).toBe(false);
    expect(component.contactsMenuOpen()).toBe(false);
    expect(component.newSubtaskTitle()).toBe('');
    expect(component.errorMessage()).toBe('');
  });

  /**
   * @test Checks if the priority can be updated via the dedicated setPriority method.
   */
  it('should update the priority form control when setPriority is called', () => {
    component.startEditing();
    
    component.setPriority('low');
    
    expect(component.editForm.controls.priority.value).toBe('low');
    expect(component.editForm.controls.priority.dirty).toBe(true);
  });

  /**
   * @test Verifies the full CRUD lifecycle of drafting subtasks in edit mode.
   */
  it('should allow adding, updating, and removing editable subtasks', () => {
    component.startEditing();
    
    component.newSubtaskTitle.set('New Draft Subtask');
    component.addSubtask();
    expect(component.editableSubtasks().length).toBe(2);
    expect(component.editableSubtasks()[1].title).toBe('New Draft Subtask');
    expect(component.newSubtaskTitle()).toBe('');

    const mockInputEvent = { target: { value: 'Updated Draft' } } as unknown as Event;
    component.updateEditableSubtaskTitle(1, mockInputEvent);
    expect(component.editableSubtasks()[1].title).toBe('Updated Draft');

    component.removeEditableSubtask(1);
    expect(component.editableSubtasks().length).toBe(1);
  });

  /**
   * @test Ensures contact selection toggling updates the internal selection signal correctly.
   */
  it('should toggle contact selection correctly', () => {
    component.startEditing();
    expect(component.isContactSelected('c-1')).toBe(true);
    expect(component.isContactSelected('c-2')).toBe(false);

    component.toggleContactSelection('c-2');
    expect(component.isContactSelected('c-2')).toBe(true);
    expect(component.selectedContactIds()).toContain('c-2');

    component.toggleContactSelection('c-1');
    expect(component.isContactSelected('c-1')).toBe(false);
    expect(component.selectedContactIds()).not.toContain('c-1');
  });

  /**
   * @test Verifies that clicking outside the contacts dropdown menu closes it.
   */
  it('should close the contacts menu if handleDialogClick is called outside the select area', () => {
    component.contactsMenuOpen.set(true);
    
    const mockEvent = {
      stopPropagation: vi.fn(),
      target: document.createElement('div')
    } as unknown as MouseEvent;

    component['handleDialogClick'](mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.contactsMenuOpen()).toBe(false);
  });

  /**
   * @test Verifies that document-level clicks outside the menu close it.
   */
  it('should close the contacts menu if onDocumentClick is triggered outside the dialog', () => {
    component.contactsMenuOpen.set(true);
    
    const mockEvent = { target: document.createElement('body') } as unknown as Event;
    
    component['onDocumentClick'](mockEvent);

    expect(component.contactsMenuOpen()).toBe(false);
  });

  /**
   * @test Verifies successful interaction with the TaskService when toggling a subtask directly from view mode.
   */
  it('should toggle subtask completion via service and emit updated subtask', async () => {
    const updatedMock = { ...MOCK_SUBTASKS[0], isCompleted: true };
    mockTaskService.toggleSubtaskCompletion.mockResolvedValue(updatedMock);
    
    const mockEvent = { target: { checked: true } } as unknown as Event;
    
    await component.toggleSubtask(MOCK_SUBTASKS[0], mockEvent);

    expect(mockTaskService.toggleSubtaskCompletion).toHaveBeenCalledWith('sub-1', true);
    expect(component.subtaskUpdated.emit).toHaveBeenCalledWith(updatedMock);
    expect(component.errorMessage()).toBe('');
  });

  /**
   * @test Ensures that a failing subtask toggle restores the UI checkbox state and displays an error.
   */
  it('should handle subtask toggle failure by reverting checkbox and showing error', async () => {
    mockTaskService.toggleSubtaskCompletion.mockRejectedValue(new Error('Network Error'));
    
    const mockEvent = { target: { checked: true } } as unknown as Event;
    
    await component.toggleSubtask(MOCK_SUBTASKS[0], mockEvent);

    expect(mockTaskService.toggleSubtaskCompletion).toHaveBeenCalled();
    expect((mockEvent.target as HTMLInputElement).checked).toBe(false);
    expect(component.errorMessage()).toBe('Subtask could not be updated.');
  });

  /**
   * @test Verifies that the task deletion workflow calls the service, emits, and closes the dialog.
   */
  it('should delete task, emit taskDeleted, and close dialog on success', async () => {
    mockTaskService.deleteTask.mockResolvedValue();
    
    await component.deleteTask();

    expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task-1');
    expect(component.taskDeleted.emit).toHaveBeenCalledWith('task-1');
    expect(component.isClosing()).toBe(true);
  });

  /**
   * @test Prevents saving the edited task if required form fields or subtasks are invalid.
   */
  it('should reject saving if edit form is invalid', async () => {
    component.startEditing();
    component.editForm.controls.title.setValue('');
    
    await component.saveTask();

    expect(mockTaskService.updateTaskWithRelations).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Please complete all required fields.');
  });

  /**
   * @test Ensures validation blocks saving if any editable subtask has an empty title.
   */
  it('should reject saving if an editable subtask has an empty title', async () => {
    component.startEditing();
    
    const mockInputEvent = { target: { value: '   ' } } as unknown as Event;
    component.updateEditableSubtaskTitle(0, mockInputEvent);
    
    expect(component.hasInvalidSubtask()).toBe(true);

    await component.saveTask();

    expect(mockTaskService.updateTaskWithRelations).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Please complete all required fields.');
  });

  /**
   * @test Verifies the complete positive workflow for saving an edited task, including payload mapping.
   */
  it('should format payload, save changes via service, and emit taskUpdated event', async () => {
    const updatedTaskResponse = { ...MOCK_TASK, title: 'Updated Title' };
    mockTaskService.updateTaskWithRelations.mockResolvedValue(updatedTaskResponse);
    
    component.startEditing();
    component.editForm.patchValue({ title: 'Updated Title ', description: ' New Desc ' });
    
    await component.saveTask();

    expect(mockTaskService.updateTaskWithRelations).toHaveBeenCalledWith('task-1', {
      task: {
        title: 'Updated Title',
        description: 'New Desc',
        dueDate: '2026-07-30',
        priority: 'urgent',
        category: 'technical_task'
      },
      subtasks: [
        { id: 'sub-1', title: 'Backend PR', isCompleted: false, sortOrder: 0 }
      ],
      contactIds: ['c-1']
    });

    expect(component.taskUpdated.emit).toHaveBeenCalledWith({
      task: updatedTaskResponse,
      subtasks: MOCK_SUBTASKS,
      assignedContacts: [MOCK_CONTACTS[0]]
    });
    
    expect(component.isEditing()).toBe(false);
  });

  /**
   * @test Verifies error handling during the task update process.
   */
  it('should gracefully handle API errors during saveTask', async () => {
    mockTaskService.updateTaskWithRelations.mockRejectedValue(new Error('Internal Server Error'));
    
    component.startEditing();
    
    await component.saveTask();

    expect(mockTaskService.updateTaskWithRelations).toHaveBeenCalled();
    expect(component.taskUpdated.emit).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Task could not be updated.');
    expect(component.isEditing()).toBe(true);
  });
});