import { DOCUMENT } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { Task } from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';

@Component({
  selector: 'app-board-cards-dialog',
  standalone: true,
  imports: [],
  templateUrl: './board-cards-dialog.html',
  styleUrl: './board-cards-dialog.scss',
})
export class BoardCardsDialog
  implements OnInit, OnDestroy
{
  private readonly closeAnimationMs = 200;
  private readonly document = inject(DOCUMENT);
  private readonly taskService =
    inject(TaskService);

  private previousBodyOverflow = '';
  private previousHtmlOverflow = '';
  private closeTimerId: number | undefined;

  readonly task = input.required<Task>();
  readonly subtasks = input<Subtask[]>([]);
  readonly assignedContacts =
    input<Contact[]>([]);

  readonly dialogClosed = output<void>();
  readonly subtaskUpdated =
    output<Subtask>();
  readonly taskDeleted = output<string>();

  readonly isClosing = signal(false);
  readonly isDeleting = signal(false);
  readonly updatingSubtaskId =
    signal<string | null>(null);
  readonly errorMessage = signal('');

  readonly categoryLabel = computed(() => {
    return this.task().category ===
      'technical_task'
      ? 'Technical Task'
      : 'User Story';
  });

  readonly priorityLabel = computed(() => {
    const priority = this.task().priority;

    return (
      priority.charAt(0).toUpperCase() +
      priority.slice(1)
    );
  });

  readonly formattedDueDate = computed(() => {
    return formatDueDate(
      this.task().dueDate,
    );
  });

  ngOnInit(): void {
    this.previousBodyOverflow =
      this.document.body.style.overflow;

    this.previousHtmlOverflow =
      this.document.documentElement
        .style.overflow;

    this.document.body.style.overflow =
      'hidden';

    this.document.documentElement
      .style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    if (this.closeTimerId !== undefined) {
      window.clearTimeout(
        this.closeTimerId,
      );
    }

    this.document.body.style.overflow =
      this.previousBodyOverflow;

    this.document.documentElement
      .style.overflow =
      this.previousHtmlOverflow;
  }

  closeDialog(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);

    this.closeTimerId = window.setTimeout(
      () => {
        this.dialogClosed.emit();
      },
      this.closeAnimationMs,
    );
  }

  async toggleSubtask(
    subtask: Subtask,
    event: Event,
  ): Promise<void> {
    const checkbox =
      event.target as HTMLInputElement;

    this.updatingSubtaskId.set(
      subtask.id,
    );

    this.errorMessage.set('');

    try {
      const updatedSubtask =
        await this.taskService
          .toggleSubtaskCompletion(
            subtask.id,
            checkbox.checked,
          );

      this.subtaskUpdated.emit(
        updatedSubtask,
      );
    } catch (error) {
      checkbox.checked =
        subtask.isCompleted;

      console.error(
        'Subtask could not be updated.',
        error,
      );

      this.errorMessage.set(
        'Subtask could not be updated.',
      );
    } finally {
      this.updatingSubtaskId.set(null);
    }
  }

  async deleteTask(): Promise<void> {
    if (this.isDeleting()) {
      return;
    }

    const taskId = this.task().id;

    this.isDeleting.set(true);
    this.errorMessage.set('');

    try {
      await this.taskService.deleteTask(
        taskId,
      );

      this.taskDeleted.emit(taskId);
      this.closeDialog();
    } catch (error) {
      console.error(
        'Task could not be deleted.',
        error,
      );

      this.errorMessage.set(
        'Task could not be deleted.',
      );

      this.isDeleting.set(false);
    }
  }

  getInitials(contact: Contact): string {
    return (
      contact.firstName.charAt(0) +
      contact.lastName.charAt(0)
    ).toUpperCase();
  }
}

function formatDueDate(
  dueDate: string,
): string {
  const [year, month, day] =
    dueDate.split('-');

  if (!year || !month || !day) {
    return dueDate;
  }

  return `${day}/${month}/${year}`;
}