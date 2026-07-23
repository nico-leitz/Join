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
  private readonly elementRef =
    inject(ElementRef<HTMLElement>);

  readonly task = input.required<Task>();
  readonly subtasks = input<Subtask[]>([]);
  readonly assignedContacts =
    input<Contact[]>([]);

  readonly cardClick = output<void>();
  readonly moveRequested = output<TaskStatus>();

  protected readonly moveMenuOpen =
    signal(false);

  readonly progress = computed(() => {
    return calculateSubtaskProgress(
      this.subtasks(),
    );
  });

  readonly categoryLabel = computed(() => {
    return this.task().category ===
      'technical_task'
      ? 'Technical Task'
      : 'User Story';
  });

  openCard(): void {
    this.cardClick.emit();
  }

  getInitials(contact: Contact): string {
    return (
      contact.firstName.charAt(0) +
      contact.lastName.charAt(0)
    ).toUpperCase();
  }

  protected toggleMoveMenu(
    event: Event,
  ): void {
    event.stopPropagation();

    this.moveMenuOpen.update((isOpen) => {
      return !isOpen;
    });
  }

  protected closeMoveMenu(): void {
    this.moveMenuOpen.set(false);
  }

  protected requestMove(
    event: Event,
    status: TaskStatus,
  ): void {
    event.stopPropagation();

    this.moveRequested.emit(status);
    this.closeMoveMenu();
  }

  protected onDocumentClick(
    event: Event,
  ): void {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (
      !this.elementRef.nativeElement.contains(
        target,
      )
    ) {
      this.closeMoveMenu();
    }
  }
}