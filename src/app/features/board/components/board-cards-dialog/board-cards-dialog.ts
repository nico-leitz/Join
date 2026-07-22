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
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';
import { UpdateTaskSubtaskInput } from '../../../../core/models/task-persistence.model';
import { Subtask } from '../../../../core/models/subtask.model';
import {
  Task,
  TaskCategory,
  TaskPriority,
} from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';

export interface TaskDialogUpdate {
  task: Task;
  subtasks: Subtask[];
  assignedContacts: Contact[];
}

interface EditableSubtask {
  id?: string;
  title: string;
  isCompleted: boolean;
}

@Component({
  selector: 'app-board-cards-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './board-cards-dialog.html',
  styleUrl: './board-cards-dialog.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)':
      'closeContactsMenu()',
  },
})
export class BoardCardsDialog
  implements OnInit, OnDestroy
{
  private readonly closeAnimationMs = 200;

  private readonly document = inject(DOCUMENT);

  private readonly taskService =
    inject(TaskService);

  private readonly formBuilder =
    inject(FormBuilder);

  private previousBodyOverflow = '';
  private previousHtmlOverflow = '';
  private closeTimerId: number | undefined;

  readonly task = input.required<Task>();

  readonly subtasks =
    input<Subtask[]>([]);

  readonly assignedContacts =
    input<Contact[]>([]);

  readonly availableContacts =
    input<Contact[]>([]);

  readonly dialogClosed = output<void>();

  readonly subtaskUpdated =
    output<Subtask>();

  readonly taskDeleted =
    output<string>();

  readonly taskUpdated =
    output<TaskDialogUpdate>();

  readonly isClosing = signal(false);
  readonly isDeleting = signal(false);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);

  readonly contactsMenuOpen =
    signal(false);

  readonly updatingSubtaskId =
    signal<string | null>(null);

  readonly selectedContactIds =
    signal<string[]>([]);

  readonly editableSubtasks =
    signal<EditableSubtask[]>([]);

  readonly newSubtaskTitle =
    signal('');

  readonly errorMessage =
    signal('');

  readonly editForm =
    this.formBuilder.nonNullable.group({
      title: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(120),
        ],
      ],
      description: [
        '',
        Validators.maxLength(1000),
      ],
      dueDate: [
        '',
        Validators.required,
      ],
      priority: [
        'medium' as TaskPriority,
        Validators.required,
      ],
      category: [
        'user_story' as TaskCategory,
        Validators.required,
      ],
    });

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

  readonly selectedContacts = computed(() => {
    const selectedIds = new Set(
      this.selectedContactIds(),
    );

    return this.availableContacts().filter(
      (contact) => {
        return selectedIds.has(contact.id);
      },
    );
  });

  readonly contactSelectionLabel =
    computed(() => {
      const selectedAmount =
        this.selectedContactIds().length;

      if (selectedAmount === 0) {
        return 'Select contacts to assign';
      }

      if (selectedAmount === 1) {
        return '1 contact selected';
      }

      return `${selectedAmount} contacts selected`;
    });

  ngOnInit(): void {
    this.lockPageScroll();
  }

  ngOnDestroy(): void {
    this.clearCloseTimer();
    this.restorePageScroll();
  }

  closeDialog(): void {
    if (
      this.isClosing() ||
      this.isSaving()
    ) {
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

  protected handleDialogClick(
    event: MouseEvent,
  ): void {
    event.stopPropagation();

    if (!this.contactsMenuOpen()) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      this.closeContactsMenu();
      return;
    }

    const contactSelect = target.closest(
      '.board_dialog__contact_select',
    );

    if (!contactSelect) {
      this.closeContactsMenu();
    }
  }

  protected onDocumentClick(
    event: Event,
  ): void {
    if (!this.contactsMenuOpen()) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      this.closeContactsMenu();
      return;
    }

    const contactSelect = target.closest(
      '.board_dialog__contact_select',
    );

    if (!contactSelect) {
      this.closeContactsMenu();
    }
  }

  protected closeContactsMenu(): void {
    this.contactsMenuOpen.set(false);
  }

  startEditing(): void {
    if (
      this.isDeleting() ||
      this.isSaving()
    ) {
      return;
    }

    this.initializeEditForm();
    this.initializeContactSelection();
    this.initializeEditableSubtasks();

    this.newSubtaskTitle.set('');
    this.closeContactsMenu();
    this.errorMessage.set('');
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    if (this.isSaving()) {
      return;
    }

    this.closeContactsMenu();
    this.newSubtaskTitle.set('');
    this.errorMessage.set('');
    this.isEditing.set(false);
  }

  setPriority(
    priority: TaskPriority,
  ): void {
    this.editForm.controls.priority
      .setValue(priority);

    this.editForm.controls.priority
      .markAsDirty();
  }

  toggleContactsMenu(): void {
    this.contactsMenuOpen.update(
      (isOpen) => {
        return !isOpen;
      },
    );
  }

  isContactSelected(
    contactId: string,
  ): boolean {
    return this.selectedContactIds()
      .includes(contactId);
  }

  toggleContactSelection(
    contactId: string,
  ): void {
    this.selectedContactIds.update(
      (contactIds) => {
        if (
          contactIds.includes(contactId)
        ) {
          return contactIds.filter(
            (id) => {
              return id !== contactId;
            },
          );
        }

        return [
          ...contactIds,
          contactId,
        ];
      },
    );
  }

  updateNewSubtaskTitle(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.newSubtaskTitle.set(
      input.value,
    );
  }

  addSubtask(): void {
    const title =
      this.newSubtaskTitle().trim();

    if (!title) {
      return;
    }

    this.editableSubtasks.update(
      (subtasks) => {
        return [
          ...subtasks,
          {
            title,
            isCompleted: false,
          },
        ];
      },
    );

    this.newSubtaskTitle.set('');
  }

  updateEditableSubtaskTitle(
    index: number,
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.editableSubtasks.update(
      (subtasks) => {
        return subtasks.map(
          (subtask, currentIndex) => {
            if (currentIndex !== index) {
              return subtask;
            }

            return {
              ...subtask,
              title: input.value,
            };
          },
        );
      },
    );
  }

  removeEditableSubtask(
    index: number,
  ): void {
    this.editableSubtasks.update(
      (subtasks) => {
        return subtasks.filter(
          (_, currentIndex) => {
            return currentIndex !== index;
          },
        );
      },
    );
  }

  hasInvalidSubtask(): boolean {
    return this.editableSubtasks().some(
      (subtask) => {
        return (
          subtask.title.trim().length === 0
        );
      },
    );
  }

  async saveTask(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.editForm.markAllAsTouched();
    this.errorMessage.set('');

    if (
      this.editForm.invalid ||
      this.hasInvalidSubtask()
    ) {
      this.errorMessage.set(
        'Please complete all required fields.',
      );

      return;
    }

    await this.executeTaskUpdate();
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
    if (
      this.isDeleting() ||
      this.isSaving()
    ) {
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

  private initializeEditForm(): void {
    const task = this.task();

    this.editForm.reset({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
    });
  }

  private initializeContactSelection(): void {
    this.selectedContactIds.set(
      this.assignedContacts().map(
        (contact) => {
          return contact.id;
        },
      ),
    );
  }

  private initializeEditableSubtasks(): void {
    this.editableSubtasks.set(
      this.subtasks().map((subtask) => {
        return {
          id: subtask.id,
          title: subtask.title,
          isCompleted:
            subtask.isCompleted,
        };
      }),
    );
  }

  private async executeTaskUpdate():
    Promise<void> {
    this.isSaving.set(true);

    try {
      const updatedTask =
        await this.persistTaskChanges();

      this.emitTaskUpdate(updatedTask);

      this.closeContactsMenu();
      this.isEditing.set(false);
    } catch (error) {
      this.handleTaskUpdateError(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private handleTaskUpdateError(
    error: unknown,
  ): void {
    console.error(
      'Task could not be updated.',
      error,
    );

    this.errorMessage.set(
      'Task could not be updated.',
    );
  }

  private async persistTaskChanges():
    Promise<Task> {
    const formValue =
      this.editForm.getRawValue();

    return this.taskService
      .updateTaskWithRelations(
        this.task().id,
        {
          task: {
            title:
              formValue.title.trim(),
            description:
              formValue.description.trim(),
            dueDate:
              formValue.dueDate,
            priority:
              formValue.priority,
            category:
              formValue.category,
          },
          subtasks:
            this.createSubtaskPayload(),
          contactIds: [
            ...this.selectedContactIds(),
          ],
        },
      );
  }

  private createSubtaskPayload():
    UpdateTaskSubtaskInput[] {
    return this.editableSubtasks().map(
      (subtask, index) => {
        return {
          ...(subtask.id && {
            id: subtask.id,
          }),
          title: subtask.title.trim(),
          isCompleted:
            subtask.isCompleted,
          sortOrder: index,
        };
      },
    );
  }

  private emitTaskUpdate(
    updatedTask: Task,
  ): void {
    this.taskUpdated.emit({
      task: updatedTask,
      subtasks: [
        ...this.taskService
          .selectedSubtasks(),
      ],
      assignedContacts: [
        ...this.taskService
          .assignedContacts(),
      ],
    });
  }

  private lockPageScroll(): void {
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

  private restorePageScroll(): void {
    this.document.body.style.overflow =
      this.previousBodyOverflow;

    this.document.documentElement
      .style.overflow =
      this.previousHtmlOverflow;
  }

  private clearCloseTimer(): void {
    if (
      this.closeTimerId === undefined
    ) {
      return;
    }

    window.clearTimeout(
      this.closeTimerId,
    );
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