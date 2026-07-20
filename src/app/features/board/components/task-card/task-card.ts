import { Component, input, output, computed } from '@angular/core';
import { Task } from '../../../../core/models/task.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { Contact } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-task-card',
  imports: [],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  task = input.required<Task>();
  subtasks = input<Subtask[]>([]);
  assignedContacts = input<Contact[]>([]);

  cardClick = output<void>();

  progressPercentage = computed(() => {
    const total = this.subtasks().length;
    if (total === 0) return 0;
    const done = this.subtasks().filter((s) => s.isCompleted).length;
    return (done / total) * 100;
  });
}
