import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { AddTaskDialog } from './add-task-dialog';
import { TaskService } from '../../../../core/services/task.service';
import { ContactService } from '../../../../core/services/contact.service';
import { Task } from '../../../../core/models/task.model';

/**
 * @description Unit tests for the AddTaskDialog component.
 * This suite validates the scroll locking mechanism, closing animations,
 * delayed success states, and internal state guards.
 */
describe('AddTaskDialog Component', () => {
  let component: AddTaskDialog;
  let fixture: ComponentFixture<AddTaskDialog>;
  let mockDocument: Document;
  let mockTaskService: any;
  let mockContactService: any;

  beforeEach(async () => {
    mockTaskService = {
      allTasks: signal([]),
      getTasks: vi.fn().mockResolvedValue([]),
    };

    mockContactService = {
      allContacts: signal([]),
      getContacts: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [AddTaskDialog],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: ContactService, useValue: mockContactService }
      ]
    }).compileComponents();

    mockDocument = TestBed.inject(DOCUMENT);
    mockDocument.body.style.overflow = '';
    mockDocument.documentElement.style.overflow = '';

    fixture = TestBed.createComponent(AddTaskDialog);
    component = fixture.componentInstance;

    vi.spyOn(component.dialogClosed, 'emit');
    vi.spyOn(component.taskCreated, 'emit');

    vi.useFakeTimers();

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    mockDocument.body.style.overflow = '';
    mockDocument.documentElement.style.overflow = '';
  });

  /**
   * @test Ensures the component initializes correctly and immediately locks page scrolling.
   */
  it('should create the component and lock page scroll on init', () => {
    expect(component).toBeTruthy();
    expect(mockDocument.body.style.overflow).toBe('hidden');
    expect(mockDocument.documentElement.style.overflow).toBe('hidden');
  });

  /**
   * @test Verifies that the previous scroll state is restored when the dialog is destroyed.
   */
  it('should restore page scroll when destroyed', () => {
    component.ngOnDestroy();
    
    expect(mockDocument.body.style.overflow).toBe('');
    expect(mockDocument.documentElement.style.overflow).toBe('');
  });

  /**
   * @test Checks that clicks inside the dialog do not propagate to the background overlay.
   */
  it('should stop event propagation on dialog click', () => {
    const mockEvent = new MouseEvent('click');
    vi.spyOn(mockEvent, 'stopPropagation');
    
    (component as any).handleDialogClick(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  /**
   * @test Ensures the dialog initiates the close animation and emits after 200ms.
   */
  it('should close dialog with animation and emit closed event', () => {
    (component as any).closeDialog();
    
    expect(component.isClosing()).toBe(true);
    
    vi.advanceTimersByTime(200);
    
    expect(component.dialogClosed.emit).toHaveBeenCalled();
  });

  /**
   * @test Verifies the internal guard preventing closure while the form is submitting.
   */
  it('should not close if the child component is currently submitting', () => {
    const mockChild = { isSubmitting: signal(true) };
    (component as any).addTaskContent = mockChild;

    (component as any).closeDialog();
    
    expect(component.isClosing()).toBe(false);
  });

  /**
   * @test Checks the full chained workflow: show success (800ms) -> animate close (200ms) -> emit.
   */
  it('should handle successful task creation with delayed closing sequence', () => {
    const mockTask = { id: 'task-123', title: 'New Task' } as Task;
    
    (component as any).handleTaskCreated(mockTask);
    
    expect(component.hasCreatedTask()).toBe(true);
    expect(component.isClosing()).toBe(false);

    vi.advanceTimersByTime(800);
    
    expect(component.isClosing()).toBe(true);
    expect(component.taskCreated.emit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    
    expect(component.taskCreated.emit).toHaveBeenCalledWith(mockTask);
    expect(component.dialogClosed.emit).not.toHaveBeenCalled();
  });

  /**
   * @test Ensures that the task creation handler cannot be triggered multiple times in a row.
   */
  it('should ignore subsequent task creation events if one is already processing', () => {
    const firstTask = { id: 'task-1' } as Task;
    const secondTask = { id: 'task-2' } as Task;
    
    (component as any).handleTaskCreated(firstTask);
    (component as any).handleTaskCreated(secondTask);

    vi.advanceTimersByTime(1000);

    expect(component.taskCreated.emit).toHaveBeenCalledTimes(1);
    expect(component.taskCreated.emit).toHaveBeenCalledWith(firstTask);
  });
});