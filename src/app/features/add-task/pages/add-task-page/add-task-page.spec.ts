import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { AddTaskPage } from './add-task-page';
import { TaskService } from '../../../../core/services/task.service';
import { ContactService } from '../../../../core/services/contact.service';
import { Task } from '../../../../core/models/task.model';

/**
 * @description Unit tests for the AddTaskPage component.
 * This suite verifies the reading of URL query parameters for task initialization,
 * delayed routing upon task creation, and proper cleanup of background timers.
 */
describe('AddTaskPage Component', () => {
  let component: AddTaskPage;
  let fixture: ComponentFixture<AddTaskPage>;
  let router: Router;
  let mockActivatedRoute: any;
  let mockTaskService: any;
  let mockContactService: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };

    mockTaskService = {
      allTasks: signal([]),
      getTasks: vi.fn().mockResolvedValue([])
    };

    mockContactService = {
      allContacts: signal([]),
      getContacts: vi.fn().mockResolvedValue([])
    };

    await TestBed.configureTestingModule({
      imports: [AddTaskPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TaskService, useValue: mockTaskService },
        { provide: ContactService, useValue: mockContactService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddTaskPage);
    component = fixture.componentInstance;
    
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true as any);

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * @test Ensures the component initializes correctly without errors.
   */
  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  /**
   * @test Verifies that valid status strings from the URL update the internal signal.
   */
  it('should read a valid task status from query parameters on init', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.mockReturnValue('in_progress');
    
    component.ngOnInit();
    
    expect(component.taskStatus()).toBe('in_progress');
  });

  /**
   * @test Ensures that invalid query parameters are ignored, defaulting to 'todo'.
   */
  it('should ignore invalid task status from query parameters and keep default', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.mockReturnValue('invalid_status');
    
    component.ngOnInit();
    
    expect(component.taskStatus()).toBe('todo');
  });

  /**
   * @test Checks the redirection logic, ensuring navigation happens exactly after 800ms.
   */
  it('should navigate to board after an 800ms delay when a task is created', () => {
    const mockTask = { id: 'task-1' } as Task;
    
    (component as any).handleTaskCreated(mockTask);
    
    expect(router.navigate).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(800);
    
    expect(router.navigate).toHaveBeenCalledWith(['/board']);
  });

  /**
   * @test Ensures the component safely resets an existing timer if a task is created rapidly again.
   */
  it('should reset the timer if handleTaskCreated is called multiple times', () => {
    const mockTask = { id: 'task-1' } as Task;
    
    (component as any).handleTaskCreated(mockTask);
    vi.advanceTimersByTime(400); 
    
    (component as any).handleTaskCreated(mockTask);
    vi.advanceTimersByTime(400); 
    
    expect(router.navigate).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(400);
    
    expect(router.navigate).toHaveBeenCalledWith(['/board']);
  });

  /**
   * @test Verifies that destroying the component clears the timer, preventing memory leaks or unwanted navigation.
   */
  it('should clear the redirect timer on component destruction', () => {
    const mockTask = { id: 'task-1' } as Task;
    
    (component as any).handleTaskCreated(mockTask);
    
    component.ngOnDestroy();
    
    vi.advanceTimersByTime(800);
    
    expect(router.navigate).not.toHaveBeenCalled();
  });
});