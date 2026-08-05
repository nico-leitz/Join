import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskCard } from './task-card';
import { MOCK_CONTACTS, MOCK_SUBTASKS, MOCK_TASK } from './task-card-test.utils';

/** Protected task-card surface exercised by interaction tests. */
interface TaskCardTestAccess {
  /** Current visibility of the mobile move menu. */
  moveMenuOpen: WritableSignal<boolean>;

  /** Handles document clicks for outside-click detection. */
  onDocumentClick(event: Event): void;
}

let component: TaskCard;
let fixture: ComponentFixture<TaskCard>;

/** Configures the standalone task-card testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [TaskCard],
  }).compileComponents();
}

/** Applies the standard task, subtask and contact inputs. */
function setComponentInputs(): void {
  fixture.componentRef.setInput('task', MOCK_TASK);
  fixture.componentRef.setInput('subtasks', MOCK_SUBTASKS);
  fixture.componentRef.setInput('assignedContacts', MOCK_CONTACTS.slice(0, 2));
}

/** Spies on the task-card outputs used by the tests. */
function spyOnOutputs(): void {
  vi.spyOn(component.cardClick, 'emit');
  vi.spyOn(component.moveRequested, 'emit');
}

/** Creates a fresh task-card fixture with its standard inputs. */
async function setupComponent(): Promise<void> {
  await configureTestBed();
  fixture = TestBed.createComponent(TaskCard);
  component = fixture.componentInstance;
  setComponentInputs();
  spyOnOutputs();
  fixture.detectChanges();
}

/** Clears output spies after each task-card test. */
function cleanUpComponent(): void {
  vi.clearAllMocks();
}

/**
 * Exposes protected task-card state and handlers for focused tests.
 * @returns Test-accessible task-card surface.
 */
function getTestAccess(): TaskCardTestAccess {
  return component as unknown as TaskCardTestAccess;
}

/**
 * Queries one rendered task-card element.
 * @param selector - CSS selector of the requested element.
 * @returns Matching debug element.
 */
function queryElement(selector: string): DebugElement {
  return fixture.debugElement.query(By.css(selector));
}

/**
 * Queries one rendered native element.
 * @param selector - CSS selector of the requested element.
 * @returns Matching native element.
 */
function getElement<T extends HTMLElement>(selector: string): T {
  return queryElement(selector).nativeElement as T;
}

/**
 * Dispatches an event through the rendered card article.
 * @param eventName - Angular event-handler name to trigger.
 * @param event - Event object passed to the handler.
 */
function triggerCardEvent(eventName: string, event: Event | null): void {
  queryElement('.task_card').triggerEventHandler(eventName, event);
}

/**
 * Toggles the rendered move menu with the supplied click event.
 * @param event - Click event passed to the move button.
 */
function toggleMoveMenu(event: MouseEvent = new MouseEvent('click')): void {
  queryElement('.task_card__move_btn').triggerEventHandler('click', event);
  fixture.detectChanges();
}

/**
 * Returns every rendered move-menu item.
 * @returns Current move-menu debug elements.
 */
function getMoveMenuItems(): DebugElement[] {
  return fixture.debugElement.queryAll(By.css('.task_card__move_menu_item'));
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies technical-task category output and styling. */
function shouldRenderTechnicalCategory(): void {
  const typeElement = getElement<HTMLElement>('.task_card__type');
  expect(component.categoryLabel()).toBe('Technical Task');
  expect(typeElement.textContent?.trim()).toBe('Technical Task');
  expect(typeElement.classList.contains('task_card__type--technical')).toBe(true);
}

/** Verifies user-story category output and styling. */
function shouldRenderUserStoryCategory(): void {
  fixture.componentRef.setInput('task', { ...MOCK_TASK, category: 'user_story' });
  fixture.detectChanges();
  const typeElement = getElement<HTMLElement>('.task_card__type');
  expect(component.categoryLabel()).toBe('User Story');
  expect(typeElement.textContent?.trim()).toBe('User Story');
  expect(typeElement.classList.contains('task_card__type--user-story')).toBe(true);
}

/** Verifies rendering of the task title and description. */
function shouldRenderTaskContent(): void {
  const title = getElement<HTMLElement>('.task_card__title');
  const description = getElement<HTMLElement>('.task_card__desc');
  expect(title.textContent?.trim()).toBe('Design System Update');
  expect(description.textContent?.trim()).toBe('Update the core UI components for the new theme.');
}

/** Verifies rendering of subtask completion progress. */
function shouldRenderSubtaskProgress(): void {
  const wrapper = queryElement('.task_card__subtasks_wrapper');
  const fill = queryElement('.task_card__progress_fill');
  const text = getElement<HTMLElement>('.task_card__subtasks_text');
  expect(wrapper).toBeTruthy();
  expect(fill.styles['width']).toBe('50%');
  expect(text.textContent?.trim()).toBe('1/2 Subtasks');
}

/** Verifies that empty subtask progress remains hidden. */
function shouldHideEmptySubtaskProgress(): void {
  fixture.componentRef.setInput('subtasks', []);
  fixture.detectChanges();
  const wrapper = fixture.debugElement.query(By.css('.task_card__subtasks_wrapper'));
  expect(wrapper).toBeNull();
}

/** Verifies uppercase initials for standard and lowercase names. */
function shouldCalculateContactInitials(): void {
  const lowercaseContact = {
    ...MOCK_CONTACTS[0],
    firstName: 'john',
    lastName: 'doe',
  };
  expect(component.getInitials(MOCK_CONTACTS[0])).toBe('AA');
  expect(component.getInitials(lowercaseContact)).toBe('JD');
}

/** Verifies the standard three-contact badge limit. */
function shouldRenderThreeContactBadges(): void {
  fixture.componentRef.setInput('assignedContacts', MOCK_CONTACTS.slice(0, 3));
  fixture.detectChanges();
  const badges = fixture.debugElement.queryAll(By.css('.task_card__badge'));
  const moreBadge = fixture.debugElement.query(By.css('.task_card__badge--more'));
  expect(badges).toHaveLength(3);
  expect(moreBadge).toBeNull();
}

/** Verifies the additional-contact counter after three badges. */
function shouldRenderAdditionalContactCount(): void {
  fixture.componentRef.setInput('assignedContacts', MOCK_CONTACTS);
  fixture.detectChanges();
  const badges = fixture.debugElement.queryAll(By.css('.task_card__badge'));
  const moreBadge = getElement<HTMLElement>('.task_card__badge--more');
  expect(badges).toHaveLength(4);
  expect(moreBadge).toBeTruthy();
  expect(moreBadge.textContent?.trim()).toBe('+2');
}

/** Verifies card selection through a pointer click. */
function shouldEmitCardClickFromPointer(): void {
  triggerCardEvent('click', null);
  expect(component.cardClick.emit).toHaveBeenCalledTimes(1);
}

/** Verifies card selection through the Enter key. */
function shouldEmitCardClickFromEnter(): void {
  const event = new KeyboardEvent('keydown', { key: 'Enter' });
  triggerCardEvent('keydown.enter', event);
  expect(component.cardClick.emit).toHaveBeenCalledTimes(1);
}

/** Verifies Space-key selection and scroll prevention. */
function shouldHandleSpaceSelection(): void {
  const event = new KeyboardEvent('keydown', { key: ' ' });
  vi.spyOn(event, 'preventDefault');
  triggerCardEvent('keydown.space', event);
  expect(event.preventDefault).toHaveBeenCalled();
  expect(component.cardClick.emit).toHaveBeenCalledTimes(1);
}

/** Verifies move-menu toggling and event propagation handling. */
function shouldToggleMoveMenu(): void {
  const event = new MouseEvent('click');
  vi.spyOn(event, 'stopPropagation');
  expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeNull();
  toggleMoveMenu(event);
  expect(event.stopPropagation).toHaveBeenCalled();
  expect(queryElement('.task_card__move_menu')).toBeTruthy();
  toggleMoveMenu(event);
  expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeNull();
}

/** Verifies disabling and marking the current status option. */
function shouldDisableCurrentStatus(): void {
  toggleMoveMenu();
  const todoOption = getMoveMenuItems()[0].nativeElement as HTMLButtonElement;
  expect(todoOption.disabled).toBe(true);
  expect(todoOption.getAttribute('aria-current')).toBe('true');
}

/** Verifies status output, propagation handling and menu closing. */
function shouldRequestMoveAndCloseMenu(): void {
  toggleMoveMenu();
  const event = new MouseEvent('click');
  vi.spyOn(event, 'stopPropagation');
  getMoveMenuItems()[1].triggerEventHandler('click', event);
  fixture.detectChanges();
  expect(event.stopPropagation).toHaveBeenCalled();
  expect(component.moveRequested.emit).toHaveBeenCalled();
  expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeNull();
}

/** Verifies menu closing through the document Escape listener. */
function shouldCloseMoveMenuFromEscape(): void {
  getTestAccess().moveMenuOpen.set(true);
  fixture.detectChanges();
  expect(queryElement('.task_card__move_menu')).toBeTruthy();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  fixture.detectChanges();
  expect(fixture.debugElement.query(By.css('.task_card__move_menu'))).toBeNull();
}

/** Verifies menu closing after a click outside the component. */
function shouldCloseMoveMenuFromOutsideClick(): void {
  getTestAccess().moveMenuOpen.set(true);
  fixture.detectChanges();
  const outsideElement = document.createElement('div');
  document.body.appendChild(outsideElement);
  outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  fixture.detectChanges();
  expect(getTestAccess().moveMenuOpen()).toBe(false);
  document.body.removeChild(outsideElement);
}

/** Verifies that an internal document click keeps the menu open. */
function shouldKeepMoveMenuOpenFromInsideClick(): void {
  getTestAccess().moveMenuOpen.set(true);
  fixture.detectChanges();
  const internalElement = getElement<HTMLElement>('.task_card__title');
  getTestAccess().onDocumentClick({ target: internalElement } as unknown as Event);
  expect(getTestAccess().moveMenuOpen()).toBe(true);
}

/** Registers component rendering tests. */
// prettier-ignore
function registerRenderingTests(): void {
  it('should create the component successfully', shouldCreateComponent);
  it('should compute categoryLabel correctly for technical tasks', shouldRenderTechnicalCategory);
  it('should compute categoryLabel correctly for user stories', shouldRenderUserStoryCategory);
  it('should render the task title and description', shouldRenderTaskContent);
  it('should render the subtask progress bar when total > 0', shouldRenderSubtaskProgress);
  it('should hide the subtask progress wrapper if total is 0', shouldHideEmptySubtaskProgress);
}

/** Registers contact-badge and card-selection tests. */
// prettier-ignore
function registerCardInteractionTests(): void {
  it('should calculate contact initials correctly and convert to uppercase', shouldCalculateContactInitials);
  it('should render up to 3 contact badges without the "+X" indicator', shouldRenderThreeContactBadges);
  it('should render 3 contact badges and a "+X" indicator when contacts exceed 3', shouldRenderAdditionalContactCount);
  it('should emit cardClick when the article is clicked', shouldEmitCardClickFromPointer);
  it('should emit cardClick when the Enter key is pressed on the article', shouldEmitCardClickFromEnter);
  it('should emit cardClick and prevent default when the Space key is pressed on the article', shouldHandleSpaceSelection);
}

/** Registers move-menu interaction tests. */
// prettier-ignore
function registerMoveMenuTests(): void {
  it('should toggle the move menu when the move button is clicked', shouldToggleMoveMenu);
  it('should disable the current task status option in the move menu', shouldDisableCurrentStatus);
  it('should emit moveRequested, stop propagation, and close menu when selecting an option', shouldRequestMoveAndCloseMenu);
  it('should close the move menu when Escape key is pressed on document', shouldCloseMoveMenuFromEscape);
  it('should close the move menu on a document click outside the component', shouldCloseMoveMenuFromOutsideClick);
  it('should not close the move menu if onDocumentClick registers a click inside the component', shouldKeepMoveMenuOpenFromInsideClick);
}

/** Registers the complete task-card test suite. */
function registerTaskCardTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerRenderingTests();
  registerCardInteractionTests();
  registerMoveMenuTests();
}

describe('TaskCard Component', registerTaskCardTests);