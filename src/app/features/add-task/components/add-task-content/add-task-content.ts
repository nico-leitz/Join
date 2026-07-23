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
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';
import {
  CreateTaskWithRelationsInput,
} from '../../../../core/models/task-persistence.model';
import {
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { TaskService } from '../../../../core/services/task.service';

type AddTaskMode = 'page' | 'dialog';

interface DraftSubtask {
  title: string;
}

@Component({
  selector: 'app-add-task-content',
  imports: [ReactiveFormsModule],
  templateUrl: './add-task-content.html',
  styleUrl: './add-task-content.scss',
  host: {
    '(document:click)': 'handleDocumentClick()',
    '(document:keydown.escape)': 'closeMenus()',
  },
})
export class AddTaskContent
  implements OnInit, OnDestroy
{
  private readonly taskService =
    inject(TaskService);

  private readonly contactService =
    inject(ContactService);

  private successTimerId:
    number | undefined;

  readonly mode =
    input<AddTaskMode>('page');

  readonly status =
    input<TaskStatus>('todo');

  readonly cancelled =
    output<void>();

  readonly taskCreated =
    output<Task>();

  readonly allContacts =
    this.contactService.allContacts;

  readonly isLoadingData =
    signal(false);

  readonly isSubmitting =
    signal(false);

  readonly contactsMenuOpen =
    signal(false);

  readonly categoryMenuOpen =
    signal(false);

  readonly selectedContactIds =
    signal<string[]>([]);

  readonly contactSearch =
    signal('');

  readonly draftSubtasks =
    signal<DraftSubtask[]>([]);

  readonly newSubtaskTitle =
    signal('');

  readonly editingSubtaskIndex =
    signal<number | null>(null);

  readonly editingSubtaskTitle =
    signal('');

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  readonly minimumDueDate =
    createDateInputValue(new Date());

  readonly categoryOptions: {
    value: TaskCategory;
    label: string;
  }[] = [
    {
      value: 'technical_task',
      label: 'Technical Task',
    },
    {
      value: 'user_story',
      label: 'User Story',
    },
  ];

  readonly taskForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.maxLength(1000),
      ],
    }),
    dueDate: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        dateNotInPastValidator(),
      ],
    }),
    priority:
      new FormControl<TaskPriority>(
        'medium',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),
    category:
      new FormControl<TaskCategory | ''>(
        '',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),
  });

  readonly filteredContacts =
    computed(() => {
      const searchValue =
        this.contactSearch()
          .trim()
          .toLowerCase();

      if (!searchValue) {
        return this.allContacts();
      }

      return this.allContacts().filter(
        (contact) => {
          return getContactSearchValue(
            contact,
          ).includes(searchValue);
        },
      );
    });

  readonly selectedContacts =
    computed(() => {
      const selectedIds = new Set(
        this.selectedContactIds(),
      );

      return this.allContacts().filter(
        (contact) => {
          return selectedIds.has(
            contact.id,
          );
        },
      );
    });

  readonly contactPlaceholder =
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

  async ngOnInit(): Promise<void> {
    await this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.clearSuccessTimer();
  }

  protected handleContentClick(
    event: MouseEvent,
  ): void {
    event.stopPropagation();

    const target = event.target;

    if (!(target instanceof Element)) {
      this.closeMenus();
      return;
    }

    this.closeUnrelatedMenus(target);
  }

  protected handleDocumentClick(): void {
    this.closeMenus();
  }

  protected closeMenus(): void {
    this.contactsMenuOpen.set(false);
    this.categoryMenuOpen.set(false);
  }

  setPriority(
    priority: TaskPriority,
  ): void {
    this.taskForm.controls.priority
      .setValue(priority);

    this.taskForm.controls.priority
      .markAsDirty();
  }

  toggleContactsMenu(): void {
    this.categoryMenuOpen.set(false);

    this.contactsMenuOpen.update(
      (isOpen) => {
        return !isOpen;
      },
    );
  }

  openContactsMenu(): void {
    this.categoryMenuOpen.set(false);
    this.contactsMenuOpen.set(true);
  }

  updateContactSearch(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.contactSearch.set(
      input.value,
    );

    this.openContactsMenu();
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
        if (contactIds.includes(contactId)) {
          return contactIds.filter(
            (id) => id !== contactId,
          );
        }

        return [
          ...contactIds,
          contactId,
        ];
      },
    );
  }

  toggleCategoryMenu(): void {
    this.contactsMenuOpen.set(false);

    this.categoryMenuOpen.update(
      (isOpen) => {
        return !isOpen;
      },
    );

    this.taskForm.controls.category
      .markAsTouched();
  }

  selectCategory(
    category: TaskCategory,
  ): void {
    this.taskForm.controls.category
      .setValue(category);

    this.taskForm.controls.category
      .markAsDirty();

    this.categoryMenuOpen.set(false);
  }

  getCategoryLabel(): string {
    const category =
      this.taskForm.controls
        .category.value;

    return this.categoryOptions.find(
      (option) => {
        return option.value === category;
      },
    )?.label ?? '';
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

    this.draftSubtasks.update(
      (subtasks) => [
        ...subtasks,
        { title },
      ],
    );

    this.newSubtaskTitle.set('');
  }

  startEditingSubtask(
    index: number,
  ): void {
    const subtask =
      this.draftSubtasks()[index];

    if (!subtask) {
      return;
    }

    this.editingSubtaskIndex.set(index);
    this.editingSubtaskTitle.set(
      subtask.title,
    );
  }

  updateEditingSubtaskTitle(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.editingSubtaskTitle.set(
      input.value,
    );
  }

  saveSubtaskEdit(): void {
    const index =
      this.editingSubtaskIndex();

    const title =
      this.editingSubtaskTitle().trim();

    if (index === null || !title) {
      return;
    }

    this.replaceSubtaskTitle(
      index,
      title,
    );

    this.cancelSubtaskEdit();
  }

  cancelSubtaskEdit(): void {
    this.editingSubtaskIndex.set(null);
    this.editingSubtaskTitle.set('');
  }

  removeSubtask(
    index: number,
  ): void {
    this.draftSubtasks.update(
      (subtasks) => {
        return subtasks.filter(
          (_, currentIndex) => {
            return currentIndex !== index;
          },
        );
      },
    );

    this.cancelSubtaskEdit();
  }

  getInitials(
    contact: Contact,
  ): string {
    return (
      contact.firstName.charAt(0) +
      contact.lastName.charAt(0)
    ).toUpperCase();
  }

  hasTitleError(): boolean {
    return hasTouchedError(
      this.taskForm.controls.title,
    );
  }

  hasDueDateError(): boolean {
    return hasTouchedError(
      this.taskForm.controls.dueDate,
    );
  }

  hasCategoryError(): boolean {
    return hasTouchedError(
      this.taskForm.controls.category,
    );
  }

  getTitleErrorMessage(): string {
    const control =
      this.taskForm.controls.title;

    if (!control.touched) {
      return '';
    }

    return control.invalid
      ? 'This field is required'
      : '';
  }

  getDueDateErrorMessage(): string {
    const control =
      this.taskForm.controls.dueDate;

    if (!control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'This field is required';
    }

    if (control.hasError('dateInPast')) {
      return 'Due date cannot be in the past';
    }

    return '';
  }

  getCategoryErrorMessage(): string {
    const control =
      this.taskForm.controls.category;

    if (!control.touched) {
      return '';
    }

    return control.invalid
      ? 'This field is required'
      : '';
  }

  handleSecondaryAction(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.mode() === 'dialog') {
      this.cancelled.emit();
      return;
    }

    this.resetForm();
  }

  async submitTask(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    this.taskForm.markAllAsTouched();
    this.errorMessage.set('');

    if (this.taskForm.invalid) {
      this.errorMessage.set(
        'Please complete all required fields.',
      );

      return;
    }

    await this.executeTaskCreation();
  }

  private async loadInitialData():
    Promise<void> {
    this.isLoadingData.set(true);

    try {
      await Promise.all([
        this.loadContacts(),
        this.loadTasks(),
      ]);
    } catch {
      this.errorMessage.set(
        'Form data could not be loaded completely.',
      );
    } finally {
      this.isLoadingData.set(false);
    }
  }

  private async loadContacts():
    Promise<void> {
    if (this.allContacts().length > 0) {
      return;
    }

    const contacts =
      await this.contactService
        .getContacts();

    this.allContacts.set(contacts);
  }

  private async loadTasks():
    Promise<void> {
    if (
      this.taskService.allTasks()
        .length > 0
    ) {
      return;
    }

    await this.taskService.getTasks();
  }

  private closeUnrelatedMenus(
    target: Element,
  ): void {
    if (
      !target.closest(
        '.add-task__contact-select',
      )
    ) {
      this.contactsMenuOpen.set(false);
    }

    if (
      !target.closest(
        '.add-task__category-select',
      )
    ) {
      this.categoryMenuOpen.set(false);
    }
  }

  private replaceSubtaskTitle(
    index: number,
    title: string,
  ): void {
    this.draftSubtasks.update(
      (subtasks) => {
        return subtasks.map(
          (subtask, currentIndex) => {
            return currentIndex === index
              ? { title }
              : subtask;
          },
        );
      },
    );
  }

  private async executeTaskCreation():
    Promise<void> {
    this.isSubmitting.set(true);

    try {
      const task =
        await this.taskService
          .createTaskWithRelations(
            this.createTaskInput(),
          );

      this.handleCreationSuccess(task);
    } catch {
      this.errorMessage.set(
        'Task could not be created.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private createTaskInput():
    CreateTaskWithRelationsInput {
    const formValue =
      this.taskForm.getRawValue();

    return {
      task: {
        title: formValue.title.trim(),
        description:
          formValue.description.trim(),
        dueDate: formValue.dueDate,
        priority: formValue.priority,
        category:
          formValue.category as TaskCategory,
        status: this.status(),
        sortOrder:
          this.getNextSortOrder(),
      },
      subtasks:
        this.createSubtaskPayload(),
      contactIds: [
        ...this.selectedContactIds(),
      ],
    };
  }

  private createSubtaskPayload() {
    return this.draftSubtasks().map(
      (subtask, index) => {
        return {
          title: subtask.title.trim(),
          sortOrder: index,
        };
      },
    );
  }

  private getNextSortOrder(): number {
    const statusTasks =
      this.taskService.allTasks().filter(
        (task) => {
          return (
            task.status === this.status()
          );
        },
      );

    return statusTasks.length;
  }

  private handleCreationSuccess(
    task: Task,
  ): void {
    this.resetForm();
    this.showSuccessMessage(
      'Task successfully created',
    );

    this.taskCreated.emit(task);
  }

  private showSuccessMessage(
    message: string,
  ): void {
    this.clearSuccessTimer();
    this.successMessage.set(message);

    this.successTimerId =
      window.setTimeout(
        () => {
          this.successMessage.set('');
        },
        2200,
      );
  }

  private resetForm(): void {
    this.taskForm.reset({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      category: '',
    });

    this.resetAdditionalFields();
  }

  private resetAdditionalFields(): void {
    this.selectedContactIds.set([]);
    this.contactSearch.set('');
    this.draftSubtasks.set([]);
    this.newSubtaskTitle.set('');
    this.cancelSubtaskEdit();
    this.closeMenus();
    this.errorMessage.set('');
  }

  private clearSuccessTimer(): void {
    if (
      this.successTimerId === undefined
    ) {
      return;
    }

    window.clearTimeout(
      this.successTimerId,
    );
  }
}

function hasTouchedError(
  control: AbstractControl,
): boolean {
  return (
    control.touched &&
    control.invalid
  );
}

function getContactSearchValue(
  contact: Contact,
): string {
  return (
    `${contact.firstName} ` +
    `${contact.lastName} ` +
    contact.email
  ).toLowerCase();
}

function createDateInputValue(
  date: Date,
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function dateNotInPastValidator():
  ValidatorFn {
  return (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const selectedDate =
      new Date(`${value}T00:00:00`);

    const today =
      createStartOfToday();

    return selectedDate < today
      ? { dateInPast: true }
      : null;
  };
}

function createStartOfToday(): Date {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
}