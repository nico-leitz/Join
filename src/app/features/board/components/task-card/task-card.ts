import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { Task } from '../../../../core/models/task.model';
import {
  calculateSubtaskProgress,
} from '../../../../core/utils/subtask-progress.utils';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly subtasks = input<Subtask[]>([]);
  readonly assignedContacts =
    input<Contact[]>([]);

  readonly cardClick = output<void>();

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
}