import { Injectable, computed, inject, signal } from '@angular/core';
import { ContactService } from '../../../../core/services/contact.service';
import { DraftSubtask, getContactSearchValue } from './add-task-content.utils';

/** Owns transient contact, menu, and subtask state for one task form. */
@Injectable()
export class AddTaskContentState {
  private readonly contactService = inject(ContactService);

  /** Contacts available for assignment. */
  readonly allContacts = this.contactService.allContacts;

  /** Whether the contact menu is open. */
  readonly contactsMenuOpen = signal(false);

  /** Whether the category menu is open. */
  readonly categoryMenuOpen = signal(false);

  /** Identifiers of selected contacts. */
  readonly selectedContactIds = signal<string[]>([]);

  /** Current contact search term. */
  readonly contactSearch = signal('');

  /** Subtasks currently drafted in the form. */
  readonly draftSubtasks = signal<DraftSubtask[]>([]);

  /** Title entered for a new subtask. */
  readonly newSubtaskTitle = signal('');

  /** Index of the subtask being edited. */
  readonly editingSubtaskIndex = signal<number | null>(null);

  /** Temporary title of the subtask being edited. */
  readonly editingSubtaskTitle = signal('');

  /** Whether the new subtask input is focused. */
  readonly isSubtaskFocused = signal(false);

  /** Contacts matching the current search term. */
  readonly filteredContacts = computed(() => {
    const searchValue = this.contactSearch().trim().toLowerCase();
    if (!searchValue) return this.allContacts();
    return this.allContacts().filter((contact) => {
      return getContactSearchValue(contact).includes(searchValue);
    });
  });

  /** Full contacts matching the selected identifiers. */
  readonly selectedContacts = computed(() => {
    const selectedIds = new Set(this.selectedContactIds());
    return this.allContacts().filter((contact) => selectedIds.has(contact.id));
  });

  /** Placeholder describing the current contact selection. */
  readonly contactPlaceholder = computed(() => {
    const selectedAmount = this.selectedContactIds().length;
    if (selectedAmount === 0) return 'Select contacts to assign';
    if (selectedAmount === 1) return '1 contact selected';
    return `${selectedAmount} contacts selected`;
  });

  /** Marks the subtask input as focused. */
  focusSubtaskInput(): void {
    this.isSubtaskFocused.set(true);
  }

  /** Marks the subtask input as blurred. */
  blurSubtaskInput(): void {
    this.isSubtaskFocused.set(false);
  }

  /**
   * Clears and blurs the new subtask input.
   * @param inputElement - Input element to blur.
   */
  clearSubtaskInput(inputElement: HTMLInputElement): void {
    this.newSubtaskTitle.set('');
    inputElement.blur();
  }

  /**
   * Handles a component click and closes unrelated menus.
   * @param event - Click event originating inside the component.
   */
  handleContentClick(event: MouseEvent): void {
    event.stopPropagation();
    const target = event.target;
    if (!(target instanceof Element)) {
      this.closeMenus();
      return;
    }
    this.closeUnrelatedMenus(target);
  }

  /** Closes every selection menu. */
  closeMenus(): void {
    this.contactsMenuOpen.set(false);
    this.categoryMenuOpen.set(false);
  }

  /** Toggles the contact menu and closes the category menu. */
  toggleContactsMenu(): void {
    this.categoryMenuOpen.set(false);
    this.contactsMenuOpen.update((isOpen) => !isOpen);
  }

  /** Opens the contact menu and closes the category menu. */
  openContactsMenu(): void {
    this.categoryMenuOpen.set(false);
    this.contactsMenuOpen.set(true);
  }

  /**
   * Updates the contact search term and opens its menu.
   * @param event - Input event containing the new search value.
   */
  updateContactSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.contactSearch.set(input.value);
    this.openContactsMenu();
  }

  /**
   * Checks whether a contact is selected.
   * @param contactId - Contact identifier to inspect.
   * @returns Whether the contact is selected.
   */
  isContactSelected(contactId: string): boolean {
    return this.selectedContactIds().includes(contactId);
  }

  /**
   * Toggles the selection of one contact.
   * @param contactId - Contact identifier to toggle.
   */
  toggleContactSelection(contactId: string): void {
    this.selectedContactIds.update((contactIds) => {
      if (contactIds.includes(contactId)) {
        return contactIds.filter((id) => id !== contactId);
      }
      return [...contactIds, contactId];
    });
  }

  /** Toggles the category menu and closes the contact menu. */
  toggleCategoryMenu(): void {
    this.contactsMenuOpen.set(false);
    this.categoryMenuOpen.update((isOpen) => !isOpen);
  }

  /** Closes the category menu. */
  closeCategoryMenu(): void {
    this.categoryMenuOpen.set(false);
  }

  /**
   * Updates the title for a new subtask.
   * @param event - Input event containing the new title.
   */
  updateNewSubtaskTitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newSubtaskTitle.set(input.value);
  }

  /** Adds a non-empty subtask to the draft. */
  addSubtask(): void {
    const title = this.newSubtaskTitle().trim();
    if (!title) return;
    this.draftSubtasks.update((subtasks) => [...subtasks, { title }]);
    this.newSubtaskTitle.set('');
  }

  /**
   * Starts editing one draft subtask.
   * @param index - Index of the subtask to edit.
   */
  startEditingSubtask(index: number): void {
    const subtask = this.draftSubtasks()[index];
    if (!subtask) return;
    this.editingSubtaskIndex.set(index);
    this.editingSubtaskTitle.set(subtask.title);
  }

  /**
   * Updates the temporary subtask edit title.
   * @param event - Input event containing the edited title.
   */
  updateEditingSubtaskTitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingSubtaskTitle.set(input.value);
  }

  /** Saves a valid subtask title edit. */
  saveSubtaskEdit(): void {
    const index = this.editingSubtaskIndex();
    const title = this.editingSubtaskTitle().trim();
    if (index === null || !title) return;
    this.replaceSubtaskTitle(index, title);
    this.cancelSubtaskEdit();
  }

  /** Clears the subtask editing state. */
  cancelSubtaskEdit(): void {
    this.editingSubtaskIndex.set(null);
    this.editingSubtaskTitle.set('');
  }

  /**
   * Removes one draft subtask.
   * @param index - Index of the subtask to remove.
   */
  removeSubtask(index: number): void {
    this.draftSubtasks.update((subtasks) => {
      return subtasks.filter((_, currentIndex) => currentIndex !== index);
    });
    this.cancelSubtaskEdit();
  }

  /** Resets all transient selection and draft state. */
  reset(): void {
    this.selectedContactIds.set([]);
    this.contactSearch.set('');
    this.draftSubtasks.set([]);
    this.newSubtaskTitle.set('');
    this.cancelSubtaskEdit();
    this.closeMenus();
  }

  /**
   * Closes menus unrelated to a clicked element.
   * @param target - Clicked element inside the component.
   */
  private closeUnrelatedMenus(target: Element): void {
    if (!target.closest('.add-task__contact-select')) this.contactsMenuOpen.set(false);
    if (!target.closest('.add-task__category-select')) this.categoryMenuOpen.set(false);
  }

  /**
   * Replaces one draft subtask title.
   * @param index - Index of the subtask to update.
   * @param title - Replacement title.
   */
  private replaceSubtaskTitle(index: number, title: string): void {
    this.draftSubtasks.update((subtasks) =>
      subtasks.map((subtask, currentIndex) => (currentIndex === index ? { title } : subtask)),
    );
  }
}