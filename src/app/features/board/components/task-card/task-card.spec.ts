import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { TaskCard } from './task-card';
import { Task, TaskStatus } from '../../../../core/models/task.model';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import * as subtaskUtils from '../../../../core/utils/subtask-progress.utils';

/**
 * @description Unit tests for the TaskCard component.
 * Verifies computed signals, badge rendering logic, accessibility interactions (keyboard navigation),
 * event propagation handling, and the dynamic behavior of the move context menu.
 */
describe('TaskCard Component', () => {
  let component: TaskCard;
  let fixture: ComponentFixture<TaskCard>;

  /** Mock task data for testing. */
  const MOCK_TASK: Task = {
    id: 'task-1',
    title: 'Design System Update',
    description: 'Update the core UI components for the new theme.',
    category: 'technical_task',
    priority: 'urgent',
    status: 'todo',
    dueDate: '2026-08-15',
    sortOrder: 1,
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01'
  };

  /** Mock subtasks data. */
  const MOCK_SUBTASKS: Subtask[] = [
    { id: 'sub-1', taskId: 'task-1', title: 'Update Buttons', isCompleted: true, sortOrder: 0, createdAt: '', updatedAt: '' },
    { id: 'sub-2', taskId: 'task-1', title: 'Update Inputs', isCompleted: false, sortOrder: 1, createdAt: '', updatedAt: '' }
  ];

  /** Mock contacts data to test badge limiting logic. */
  const MOCK_CONTACTS: Contact[] = [
    { id: 'c-1', firstName: 'Alice', lastName: 'Adams', email: 'alice@example.com', phone: '', badgeColor: '#ff0000', authUserId: '', createdAt: '', updatedAt: '' },
    { id: 'c-2', firstName: 'Bob', lastName: 'Builder', email: 'bob@example.com', phone: '', badgeColor: '#00ff00', authUserId: '', createdAt: '', updatedAt: '' },
    { id: 'c-3', firstName: 'Charlie', lastName: 'Chaplin', email: 'charlie@example.com', phone: '', badgeColor: '#0000ff', authUserId: '', createdAt: '', updatedAt: '' },
    { id: 'c-4', firstName: 'Diana', lastName: 'Prince', email: 'diana@example.com', phone: '', badgeColor: '#ff00ff', authUserId: '', createdAt: '', updatedAt: '' },
    { id: 'c-5', firstName: 'Evan', lastName: 'Wright', email: 'evan@example.com', phone: '', badgeColor: '#ffff00', authUserId: '', createdAt: '', updatedAt: '' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCard]
    }).compileComponents();

    vi.spyOn(subtaskUtils, 'calculateSubtaskProgress').mockReturnValue({
      total: 2,
      completed: 1,
      percentage: 50
    });

    fixture = TestBed.createComponent(TaskCard);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('task', MOCK_TASK);
    fixture.componentRef.setInput('subtasks', MOCK_SUBTASKS);
    fixture.componentRef.setInput('assignedContacts', MOCK_CONTACTS.slice(0, 2));

    vi.spyOn(component.cardClick, 'emit');
    vi.spyOn(component.moveRequested, 'emit');

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test Verifies that the component initializes correctly with required inputs.
   */
  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Checks the computed categoryLabel logic for technical tasks.
   */
  it('should compute categoryLabel correctly for technical tasks', () => {
    expect(component.categoryLabel()).toBe('Technical Task');
    
    const typeElement = fixture.debugElement.query(By.css('.task_card__type')).nativeElement;
    expect(typeElement.textContent.trim()).toBe('Technical Task');
    expect(typeElement.classList.contains('task_card__type--technical')).toBe(true);
  });

  /**
   * @test Checks the computed categoryLabel logic for user stories.
   */
  it('should compute categoryLabel correctly for user stories', () => {
    fixture.componentRef.setInput('task', { ...MOCK_TASK, category: 'user_story' });
    fixture.detectChanges();

    expect(component.categoryLabel()).toBe('User Story');
    
    const typeElement = fixture.debugElement.query(By.css('.task_card__type')).nativeElement;
    expect(typeElement.textContent.trim()).toBe('User Story');
    expect(typeElement.classList.contains('task_card__type--user-story')).toBe(true);
  });

  /**
   * @test Verifies that the task's title and description are rendered in the DOM.
   */
  it('should render the task title and description', () => {
    const titleEl = fixture.debugElement.query(By.css('.task_card__title')).nativeElement;
    const descEl = fixture.debugElement.query(By.css('.task_card__desc')).nativeElement;

    expect(titleEl.textContent.trim()).toBe('Design System Update');
    expect(descEl.textContent.trim()).toBe('Update the core UI components for the new theme.');
  });

  /**
   * @test Ensures that the subtask progress bar and text render correctly based on the utility output.
   */
  it('should render the subtask progress bar when total > 0', () => {
    const wrapper = fixture.debugElement.query(By.css('.task_card__subtasks_wrapper'));
    const fill = fixture.debugElement.query(By.css('.task_card__progress_fill'));
    const text = fixture.debugElement.query(By.css('.task_card__subtasks_text'));

    expect(wrapper).toBeTruthy();
    expect(fill.styles['width']).toBe('50%');
    expect(text.nativeElement.textContent.trim()).toBe('1/2 Subtasks');
  });

  /**
   * @test Verifies that the subtask progress section is completely hidden if there are no subtasks.
   */
  it('should hide the subtask progress wrapper if total is 0', () => {
    vi.spyOn(subtaskUtils, 'calculateSubtaskProgress').mockReturnValueOnce({
      total: 0,
      completed: 0,
      percentage: 0
    });
    
    fixture.componentRef.setInput('subtasks', []);
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.task_card__subtasks_wrapper'));
    expect(wrapper).toBeNull();
  });

  /**
   * @test Tests the utility method getInitials with standard names.
   */
  it('should calculate contact initials correctly and convert to uppercase', () => {
    const initials = component.getInitials(MOCK_CONTACTS[0]);
    expect(initials).toBe('AA');

    const lowercaseContact = { ...MOCK_CONTACTS[0], firstName: 'john', lastName: 'doe' };
    expect(component.getInitials(lowercaseContact)).toBe('JD');
  });

  /**
   * @test Verifies that up to 3 contact badges are rendered normally.
   */
  it('should render up to 3 contact badges without the "+X" indicator', () => {
    fixture.componentRef.setInput('assignedContacts', MOCK_CONTACTS.slice(0, 3));
    fixture.detectChanges();

    const badges = fixture.debugElement.queryAll(By.css('.task_card__badge'));
    expect(badges.length).toBe(3);
    
    const moreBadge = fixture.debugElement.query(By.css('.task_card__badge--more'));
    expect(moreBadge).toBeNull();
  });

  /**
   * @test Ensures the "+X" indicator appears correctly when more than 3 contacts are assigned.
   */
  it('should render 3 contact badges and a "+X" indicator when contacts exceed 3', () => {
    fixture.componentRef.setInput('assignedContacts', MOCK_CONTACTS);
    fixture.detectChanges();

    const badges = fixture.debugElement.queryAll(By.css('.task_card__badge'));
    expect(badges.length).toBe(4);

    const moreBadge = fixture.debugElement.query(By.css('.task_card__badge--more'));
    expect(moreBadge).toBeTruthy();
    expect(moreBadge.nativeElement.textContent.trim()).toBe('+2');
  });

  /**
   * @test Verifies that clicking the main card element triggers the openCard method.
   */
  it('should emit cardClick when the article is clicked', () => {
    const article = fixture.debugElement.query(By.css('.task_card'));
    article.triggerEventHandler('click', null);

    expect(component.cardClick.emit).toHaveBeenCalledTimes(1);
  });

  /**
   * @test Ensures keyboard accessibility by verifying the Enter key opens the card.
   */
  it('should emit cardClick when the Enter key is pressed on the article', () => {
    const article = fixture.debugElement.query(By.css('.task_card'));
    article.triggerEventHandler('keydown.enter', new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(component.cardClick.emit).toHaveBeenCalledTimes(1);
  });

  /**
   * @test Ensures keyboard accessibility by verifying the Space key opens the card and prevents default scrolling.
   */
  it('should emit cardClick and prevent default when the Space key is pressed on the article', () => {
    const mockEvent = new KeyboardEvent('keydown', { key: ' ' });
    vi.spyOn(mockEvent, 'preventDefault');

    const article = fixture.debugElement.query(By.css('.task_card'));
    article.triggerEventHandler('keydown.space', mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(component.cardClick.emit).toHaveBeenCalledTimes(1);
  });

  /**
   * @test Tests the move menu visibility toggle and stopPropagation logic.
   */
  it('should toggle the move menu when the move button is clicked', () => {
    const mockEvent = new MouseEvent('click');
    vi.spyOn(mockEvent, 'stopPropagation');

    const moveBtn = fixture.debugElement.query(By.css('.task_card__move_btn'));
    
    expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeNull();
    
    moveBtn.triggerEventHandler('click', mockEvent);
    fixture.detectChanges();

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeTruthy();

    moveBtn.triggerEventHandler('click', mockEvent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeNull();
  });

  /**
   * @test Verifies that the option corresponding to the current task status is rendered as disabled.
   */
  it('should disable the current task status option in the move menu', () => {
    const moveBtn = fixture.debugElement.query(By.css('.task_card__move_btn'));
    moveBtn.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    const menuItems = fixture.debugElement.queryAll(By.css('.task_card__move_menu_item'));
    const todoOption = menuItems[0].nativeElement;
    
    expect(todoOption.disabled).toBe(true);
    expect(todoOption.getAttribute('aria-current')).toBe('true');
  });

  /**
   * @test Ensures that clicking a valid menu option emits the requested status and closes the menu.
   */
  it('should emit moveRequested, stop propagation, and close menu when selecting an option', () => {
    const moveBtn = fixture.debugElement.query(By.css('.task_card__move_btn'));
    moveBtn.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    const mockEvent = new MouseEvent('click');
    vi.spyOn(mockEvent, 'stopPropagation');

    const menuItems = fixture.debugElement.queryAll(By.css('.task_card__move_menu_item'));
    menuItems[1].triggerEventHandler('click', mockEvent);
    fixture.detectChanges();

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.moveRequested.emit).toHaveBeenCalled();
    
    expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeNull();
  });

  /**
   * @test Verifies the HostListener for 'keydown.escape' closes the move menu.
   */
  it('should close the move menu when Escape key is pressed on document', () => {
    component['moveMenuOpen'].set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeNull();
  });

  /**
   * @test Verifies that a click outside the component hierarchy closes the move menu.
   */
  it('should close the move menu on a document click outside the component', () => {
    component['moveMenuOpen'].set(true);
    fixture.detectChanges();

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    
    outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component['moveMenuOpen']()).toBe(false);
    
    document.body.removeChild(outsideElement);
  });

  /**
   * @test Verifies that a click inside the component hierarchy (that propagates up to document) does NOT close the menu.
   */
  it('should not close the move menu if onDocumentClick registers a click inside the component', () => {
    component['moveMenuOpen'].set(true);
    fixture.detectChanges();

    const internalElement = fixture.debugElement.query(By.css('.task_card__title')).nativeElement;
    
    component['onDocumentClick']({ target: internalElement } as Event);
    
    expect(component['moveMenuOpen']()).toBe(true);
  });
});