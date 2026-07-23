import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import {
  Task,
  TaskStatus,
} from '../../../../core/models/task.model';
import {
  calculateSubtaskProgress,
} from '../../../../core/utils/subtask-progress.utils';
import { SlicePipe } from '@angular/common';

/**
 * Component for displaying a single task card.
 * 
 * @remarks
 * This component renders task details, visualizes subtask progress,
 * and provides an interface for moving the task to different status columns.
 * 
 * @public
 */
@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMoveMenu()',
  },
})
export class TaskCard {
  /** 
   * Reference to the component's host element.
   * Used for detecting clicks outside the component.
   * @internal 
   */
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** 
   * The task data to be displayed.
   * @public 
   */
  readonly task = input.required<Task>();

  /** 
   * List of subtasks associated with the task.
   * @public 
   */
  readonly subtasks = input<Subtask[]>([]);

  /** 
   * List of contacts assigned to the task.
   * @public 
   */
  readonly assignedContacts = input<Contact[]>([]);

  /** 
   * Event emitted when the user clicks the card.
   * @public 
   */
  readonly cardClick = output<void>();

  /** 
   * Event emitted when the user requests a status change.
   * @public 
   */
  readonly moveRequested = output<TaskStatus>();

  /** 
   * Signal controlling the visibility of the move menu.
   * @protected 
   */
  protected readonly moveMenuOpen = signal(false);

  /** 
   * Calculated subtask progress.
   * @readonly
   * @public
   */
  readonly progress = computed(() => {
    return calculateSubtaskProgress(this.subtasks());
  });

  /** 
   * Computed label for the task category.
   * @readonly
   * @public
   */
  readonly categoryLabel = computed(() => {
    return this.task().category === 'technical_task'
      ? 'Technical Task'
      : 'User Story';
  });

  /**
   * Opens the card detail view by emitting the `cardClick` output.
   * 
   * @public
   */
  openCard(): void {
    this.cardClick.emit();
  }

  /**
   * Generates a contact's initials from their first and last name.
   * 
   * @param contact - The contact object containing first and last names.
   * @returns A string containing the capitalized initials.
   * @public
   */
  getInitials(contact: Contact): string {
    return (
      contact.firstName.charAt(0) +
      contact.lastName.charAt(0)
    ).toUpperCase();
  }

  /**
   * Toggles the visibility of the move menu.
   * 
   * @param event - The triggering event (used to stop propagation).
   * @protected
   */
  protected toggleMoveMenu(event: Event): void {
    event.stopPropagation();
    this.moveMenuOpen.update((isOpen) => !isOpen);
  }

  /**
   * Explicitly closes the move menu.
   * 
   * @protected
   */
  protected closeMoveMenu(): void {
    this.moveMenuOpen.set(false);
  }

  /**
   * Requests a status change for the task.
   * 
   * @param event - The triggering click event.
   * @param status - The target status for the task.
   * @protected
   */
  protected requestMove(event: Event, status: TaskStatus): void {
    event.stopPropagation();
    this.moveRequested.emit(status);
    this.closeMoveMenu();
  }

  /**
   * Processes document clicks to close the menu when clicking outside the component.
   * 
   * @param event - The global document click event.
   * @protected
   */
  protected onDocumentClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Node)) return;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeMoveMenu();
    }
  }
}