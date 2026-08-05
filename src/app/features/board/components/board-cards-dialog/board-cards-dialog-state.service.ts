import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';
import { Subtask } from '../../../../core/models/subtask.model';
import { Task, TaskCategory, TaskPriority } from '../../../../core/models/task.model';

/** Represents a persisted or newly created subtask during editing. */
export interface EditableSubtask {
  /** Persisted identifier or undefined for a new subtask. */
  id?: string;
  /** Editable subtask title. */
  title: string;
  /** Current completion state. */
  isCompleted: boolean;
}

/** Owns local form, menu, subtask and lifecycle state for the task dialog. */
@Injectable()
export class BoardCardsDialogStateService {
  /** Duration of the dialog closing animation in milliseconds. */
  private readonly closeAnimationMs = 200;
  /** Browser document used to lock the underlying page scroll. */
  private readonly document = inject(DOCUMENT);
  /** Form builder used to create the non-nullable edit form. */
  private readonly formBuilder = inject(FormBuilder);
  /** Previous inline overflow value of the document body. */
  private previousBodyOverflow = '';
  /** Previous inline overflow value of the document root. */
  private previousHtmlOverflow = '';
  /** Identifier of the pending dialog close timer. */
  private closeTimerId: number | undefined;

  /** Indicates whether the dialog closing animation is running. */
  readonly isClosing = signal(false);
  /** Indicates whether the task deletion request is running. */
  readonly isDeleting = signal(false);
  /** Indicates whether the dialog displays its edit form. */
  readonly isEditing = signal(false);
  /** Indicates whether task changes are being persisted. */
  readonly isSaving = signal(false);
  /** Indicates whether the contact assignment menu is open. */
  readonly contactsMenuOpen = signal(false);
  /** Identifier of the subtask currently being updated. */
  readonly updatingSubtaskId = signal<string | null>(null);
  /** Identifiers selected in the contact assignment menu. */
  readonly selectedContactIds = signal<string[]>([]);
  /** Local editable copy of the current subtasks. */
  readonly editableSubtasks = signal<EditableSubtask[]>([]);
  /** Current title of the new subtask draft. */
  readonly newSubtaskTitle = signal('');
  /** Indicates whether the subtask creator input is focused. */
  readonly isSubtaskFocused = signal(false);
  /** Index of the subtask currently being edited inline. */
  readonly editingSubtaskIndex = signal<number | null>(null);
  /** Temporary title of the subtask currently being edited inline. */
  readonly editingSubtaskTitle = signal('');
  /** User-facing message for the latest dialog operation failure. */
  readonly errorMessage = signal('');

  /** Reactive form containing the editable task fields. */
  readonly editForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(1000)],
    dueDate: ['', Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    category: ['user_story' as TaskCategory, Validators.required],
  });

  /** Locks scrolling on the page behind the dialog. */
  initialize(): void {
    this.previousBodyOverflow = this.document.body.style.overflow;
    this.previousHtmlOverflow = this.document.documentElement.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.document.documentElement.style.overflow = 'hidden';
  }

  /** Clears pending work and restores the previous page scroll state. */
  destroy(): void {
    this.clearCloseTimer();
    this.document.body.style.overflow = this.previousBodyOverflow;
    this.document.documentElement.style.overflow = this.previousHtmlOverflow;
  }

  /**
   * Starts closing and invokes the callback after the animation.
   * @param onClosed - Callback invoked when the animation finishes.
   */
  close(onClosed: () => void): void {
    if (this.isClosing() || this.isSaving()) {
      return;
    }
    this.isClosing.set(true);
    this.closeTimerId = window.setTimeout(onClosed, this.closeAnimationMs);
  }

  /**
   * Initializes all editable state from the currently displayed task.
   * @param task - Task whose fields populate the form.
   * @param contacts - Contacts initially selected for assignment.
   * @param subtasks - Subtasks copied into local editing state.
   */
  startEditing(task: Task, contacts: Contact[], subtasks: Subtask[]): void {
    this.initializeEditForm(task);
    this.selectedContactIds.set(contacts.map((contact) => contact.id));
    this.initializeEditableSubtasks(subtasks);
    this.resetSubtaskEditState();
    this.contactsMenuOpen.set(false);
    this.errorMessage.set('');
    this.isEditing.set(true);
  }

  /** Discards local editing state and returns to the detail view. */
  cancelEditing(): void {
    this.contactsMenuOpen.set(false);
    this.resetSubtaskEditState();
    this.errorMessage.set('');
    this.isEditing.set(false);
  }

  /**
   * Applies a priority to the edit form and marks it as changed.
   * @param priority - Priority selected by the user.
   */
  setPriority(priority: TaskPriority): void {
    const priorityControl = this.editForm.controls.priority;
    priorityControl.setValue(priority);
    priorityControl.markAsDirty();
  }

  /**
   * Adds or removes a contact from the current selection.
   * @param contactId - Identifier of the contact to toggle.
   */
  toggleContactSelection(contactId: string): void {
    this.selectedContactIds.update((contactIds) => {
      if (contactIds.includes(contactId)) {
        return contactIds.filter((id) => id !== contactId);
      }
      return [...contactIds, contactId];
    });
  }

  /** Adds a non-empty subtask draft to the editable collection. */
  addSubtask(): void {
    const title = this.newSubtaskTitle().trim();
    if (!title) {
      return;
    }
    this.editableSubtasks.update((subtasks) => [...subtasks, { title, isCompleted: false }]);
    this.newSubtaskTitle.set('');
  }

  /**
   * Initializes inline editing for the subtask at the requested index.
   * @param index - Index of the subtask to edit.
   */
  startEditingSubtask(index: number): void {
    const subtask = this.editableSubtasks()[index];
    if (!subtask) {
      return;
    }
    this.editingSubtaskTitle.set(subtask.title);
    this.editingSubtaskIndex.set(index);
  }

  /** Applies the inline edited title and exits edit mode. */
  saveSubtaskEdit(): void {
    const index = this.editingSubtaskIndex();
    const title = this.editingSubtaskTitle().trim();
    if (index === null || !title) {
      return;
    }
    this.replaceSubtaskTitle(index, title);
    this.clearInlineSubtaskEdit();
  }

  /**
   * Removes an editable subtask by its current index.
   * @param index - Index of the subtask to remove.
   */
  removeEditableSubtask(index: number): void {
    this.editableSubtasks.update((subtasks) => {
      return subtasks.filter((_, currentIndex) => currentIndex !== index);
    });
    this.adjustEditingIndexAfterRemoval(index);
  }

  /**
   * Checks whether at least one editable subtask title is empty.
   * @returns True when any subtask title is invalid.
   */
  hasInvalidSubtask(): boolean {
    return this.editableSubtasks().some((subtask) => {
      return subtask.title.trim().length === 0;
    });
  }

  /**
   * Resets the edit form with the current task values.
   * @param task - Task whose values populate the form.
   */
  private initializeEditForm(task: Task): void {
    this.editForm.reset({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
    });
  }

  /**
   * Creates editable copies of the current subtasks.
   * @param subtasks - Persisted subtasks to copy.
   */
  private initializeEditableSubtasks(subtasks: Subtask[]): void {
    this.editableSubtasks.set(
      subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      })),
    );
  }

  /**
   * Replaces the title of one editable subtask.
   * @param index - Index of the subtask to update.
   * @param title - Trimmed replacement title.
   */
  private replaceSubtaskTitle(index: number, title: string): void {
    this.editableSubtasks.update((subtasks) => {
      return subtasks.map((subtask, currentIndex) => {
        return currentIndex === index ? { ...subtask, title } : subtask;
      });
    });
  }

  /**
   * Keeps inline editing aligned after a subtask was removed.
   * @param index - Index of the removed subtask.
   */
  private adjustEditingIndexAfterRemoval(index: number): void {
    const editingIndex = this.editingSubtaskIndex();
    if (editingIndex === index) {
      this.clearInlineSubtaskEdit();
      return;
    }
    if (editingIndex !== null && editingIndex > index) {
      this.editingSubtaskIndex.set(editingIndex - 1);
    }
  }

  /** Resets all local subtask creator and editing values. */
  private resetSubtaskEditState(): void {
    this.newSubtaskTitle.set('');
    this.isSubtaskFocused.set(false);
    this.clearInlineSubtaskEdit();
  }

  /** Exits the inline subtask editing mode. */
  private clearInlineSubtaskEdit(): void {
    this.editingSubtaskIndex.set(null);
    this.editingSubtaskTitle.set('');
  }

  /** Cancels and clears the pending dialog close timer. */
  private clearCloseTimer(): void {
    if (this.closeTimerId === undefined) {
      return;
    }
    window.clearTimeout(this.closeTimerId);
    this.closeTimerId = undefined;
  }
}