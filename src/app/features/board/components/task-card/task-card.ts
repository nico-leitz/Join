import { SlicePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TASK_STATUS_OPTIONS } from '../../../../core/constants/task-status.constants';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import {
  Task,
  TaskStatus,
} from '../../../../core/models/task.model';
import { calculateSubtaskProgress } from '../../../../core/utils/subtask-progress.utils';

/**
 * Displays a task summary inside a board column.
 *
 * Exposes card selection and mobile status-move actions while deriving
 * category, assignment and subtask progress data for the template.
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
  /** Host element used to detect clicks outside the task card. */
  private readonly elementRef =
    inject(
      ElementRef<HTMLElement>,
    );

  /** Task represented by the card. */
  readonly task =
    input.required<Task>();

  /** Subtasks belonging to the represented task. */
  readonly subtasks =
    input<Subtask[]>([]);

  /** Contacts assigned to the represented task. */
  readonly assignedContacts =
    input<Contact[]>([]);

  /** Emits when the task detail dialog should be opened. */
  readonly cardClick =
    output<void>();

  /** Emits a status selected through the mobile move menu. */
  readonly moveRequested =
    output<TaskStatus>();

  /** Completion progress derived from the current subtasks. */
  readonly progress =
    computed(() => {
      return calculateSubtaskProgress(
        this.subtasks(),
      );
    });

  /** Human-readable category of the represented task. */
  readonly categoryLabel =
    computed(() => {
      return this.task().category ===
        'technical_task'
        ? 'Technical Task'
        : 'User Story';
    });

  /** Indicates whether the mobile task move menu is open. */
  protected readonly moveMenuOpen =
    signal(false);

  /** Status options rendered in the mobile task move menu. */
  protected readonly taskStatusOptions =
    TASK_STATUS_OPTIONS;

  /**
   * Requests opening the represented task.
   */
  openCard(): void {
    this.cardClick.emit();
  }

  /**
   * Creates uppercase initials for a contact badge.
   *
   * @param contact - Contact whose initials should be created.
   * @returns Combined first and last name initials.
   */
  getInitials(
    contact: Contact,
  ): string {
    return (
      contact.firstName.charAt(0) +
      contact.lastName.charAt(0)
    ).toUpperCase();
  }

  /**
   * Toggles the mobile move menu without opening the task card.
   *
   * @param event - Trigger event whose propagation should be stopped.
   */
  protected toggleMoveMenu(
    event: Event,
  ): void {
    event.stopPropagation();

    this.moveMenuOpen.update(
      (isOpen) => !isOpen,
    );
  }

  /**
   * Closes the mobile task move menu.
   */
  protected closeMoveMenu(): void {
    this.moveMenuOpen.set(false);
  }

  /**
   * Emits a requested status move and closes the move menu.
   *
   * @param event - Trigger event whose propagation should be stopped.
   * @param status - Target board status selected by the user.
   */
  protected requestMove(
    event: Event,
    status: TaskStatus,
  ): void {
    event.stopPropagation();

    this.moveRequested.emit(
      status,
    );

    this.closeMoveMenu();
  }

  /**
   * Closes the move menu after a click outside the card.
   *
   * @param event - Document click event to inspect.
   */
  protected onDocumentClick(
    event: Event,
  ): void {
    const target = event.target;

    if (
      target instanceof Node &&
      !this.elementRef
        .nativeElement
        .contains(target)
    ) {
      this.closeMoveMenu();
    }
  }
}