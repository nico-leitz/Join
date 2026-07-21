import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { Task, TaskStatus } from '../../../../core/models/task.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { Contact } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-task-card',
  imports: [],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMoveMenu()',
  },
})
export class TaskCard {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  task = input.required<Task>();
  subtasks = input<Subtask[]>([]);
  assignedContacts = input<Contact[]>([]);

  cardClick = output<void>();
  moveRequested = output<TaskStatus>();
  protected readonly moveMenuOpen = signal(false);

  protected toggleMoveMenu(event: Event): void {
    event.stopPropagation();
    this.moveMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMoveMenu(): void {
    this.moveMenuOpen.set(false);
  }

  protected requestMove(event: Event, status: TaskStatus): void {
    event.stopPropagation();
    this.moveRequested.emit(status);
    this.closeMoveMenu();
  }

  protected onDocumentClick(event: Event): void {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeMoveMenu();
    }
  }

  progressPercentage = computed(() => {
    const total = this.subtasks().length;
    if (total === 0) return 0;
    const done = this.subtasks().filter((s) => s.isCompleted).length;
    return (done / total) * 100;
  });
}
