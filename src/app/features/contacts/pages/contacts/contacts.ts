import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { ContactList } from '../../components/contact-list/contact-list';
import { ContactCreateDialog } from '../../components/contact-create-dialog/contact-create-dialog';
import { ContactEditDialog } from '../../components/contact-edit-dialog/contact-edit-dialog';
import { ContactSuccessOverlay } from '../../components/contact-success-overlay/contact-success-overlay';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactDetail } from '../../components/contact-detail/contact-detail';
import {
  Contact,
  CreateContact,
  UpdateContact,
} from '../../../../core/models/contact.model';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { Header } from '../../../../layout/header/header';
import { MobileNav } from "../../../../layout/mobile-nav/mobile-nav";

/**
 * Coordinates the contact list, detail view and contact dialogs.
 *
 * Handles contact CRUD workflows, selection synchronization, success feedback
 * and page scroll locking while a dialog is open.
 */
@Component({
  selector: 'app-contacts',
  imports: [
    ContactList,
    ContactCreateDialog,
    ContactEditDialog,
    ContactSuccessOverlay,
    ContactDetail,
    Sidebar,
    Header,
  ],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts implements OnDestroy {
  /** Child contact list used to reload contacts after mutations. */
  @ViewChild(ContactList) private contactList?: ContactList;

  /** Document whose body receives the dialog scroll-lock class. */
  private readonly document = inject(DOCUMENT);

  /** Indicates whether the contact creation dialog is open. */
  isCreateDialogOpen = signal(false);

  /** Indicates whether the contact edit dialog is open. */
  isEditDialogOpen = signal(false);

  /** Contact currently selected for editing. */
  selectedContact = signal<Contact | null>(null);

  /** Success message currently displayed by the feedback overlay. */
  successMessage = signal('');

  /**
   * Creates the contacts page coordinator.
   *
   * @param contactService - Service used for contact state and persistence.
   */
  constructor(private readonly contactService: ContactService) {}

  /**
   * Restores page scrolling when the contacts page is destroyed.
   */
  ngOnDestroy(): void {
    this.unlockPageScroll();
  }

  /**
   * Opens the contact creation dialog and locks page scrolling.
   */
  openCreateDialog(): void {
    this.isCreateDialogOpen.set(true);
    this.lockPageScroll();
  }

  /**
   * Closes the contact creation dialog and synchronizes page scrolling.
   */
  closeCreateDialog(): void {
    this.isCreateDialogOpen.set(false);
    this.updatePageScrollLock();
  }

  /**
   * Selects a contact, opens the edit dialog and locks page scrolling.
   *
   * @param contact - Contact selected for editing.
   */
  openEditDialog(contact: Contact): void {
    this.selectedContact.set(contact);
    this.isEditDialogOpen.set(true);
    this.lockPageScroll();
  }

  /**
   * Closes the edit dialog, clears its selection and updates page scrolling.
   */
  closeEditDialog(): void {
    this.isEditDialogOpen.set(false);
    this.selectedContact.set(null);
    this.updatePageScrollLock();
  }

  /**
   * Creates a contact and refreshes the visible contact state.
   *
   * @param contact - Contact data to persist.
   * @returns A promise that resolves after creation and list synchronization.
   * @throws The contact creation error returned by the contact service.
   */
  async createContact(contact: CreateContact): Promise<void> {
    const createdContact = await this.contactService.createContact(contact);

    this.closeCreateDialog();
    await this.contactList?.loadContacts();
    this.selectCreatedContact(createdContact);
    this.showSuccessMessage('Contact successfully created');
  }

  /**
   * Updates the selected contact and refreshes the visible contact state.
   *
   * @param contact - Contact changes to persist.
   * @returns A promise that resolves after the update attempt.
   * @throws The contact update error returned by the contact service.
   */
  async updateContact(contact: UpdateContact): Promise<void> {
    const selectedContact = this.selectedContact();

    if (!selectedContact) {
      return;
    }

    await this.contactService.updateContact(selectedContact.id, contact);
    this.closeEditDialog();
    await this.contactList?.loadContacts();
    this.showSuccessMessage('Contact successfully updated');
  }

  /**
   * Deletes a contact and refreshes the visible contact state.
   *
   * @param contactId - Identifier of the contact to delete.
   * @returns A promise that resolves after deletion and list synchronization.
   * @throws The contact deletion error returned by the contact service.
   */
  async deleteContact(contactId: string): Promise<void> {
    await this.contactService.deleteContact(contactId);
    this.closeEditDialog();
    await this.contactList?.loadContacts();
    this.showSuccessMessage('Contact successfully deleted');
  }

  /**
   * Clears the currently displayed success message.
   */
  hideSuccessMessage(): void {
    this.successMessage.set('');
  }

  /**
   * Selects the newly created contact using the refreshed list instance.
   *
   * @param createdContact - Contact returned by the creation request.
   */
  private selectCreatedContact(createdContact: Contact): void {
    const contactFromList = this.findContactById(createdContact.id);
    this.contactService.selectedContact.set(contactFromList ?? createdContact);
  }

  /**
   * Finds a loaded contact by its identifier.
   *
   * @param contactId - Identifier of the requested contact.
   * @returns The matching contact or undefined when it is not loaded.
   */
  private findContactById(contactId: string): Contact | undefined {
    return this.contactService.allContacts().find((contact) => {
      return contact.id === contactId;
    });
  }

  /**
   * Displays success feedback and schedules its automatic removal.
   *
   * @param message - Success text to display.
   */
  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);
    window.setTimeout(() => this.hideSuccessMessage(), 2500);
  }

  /**
   * Locks page scrolling while a contact dialog is open.
   */
  private lockPageScroll(): void {
    this.document.body.classList.add('dialog-open');
  }

  /**
   * Restores page scrolling.
   */
  private unlockPageScroll(): void {
    this.document.body.classList.remove('dialog-open');
  }

  /**
   * Applies the page scroll lock only while at least one dialog is open.
   */
  private updatePageScrollLock(): void {
    const hasOpenDialog = this.isCreateDialogOpen() || this.isEditDialogOpen();

    if (hasOpenDialog) {
      this.lockPageScroll();
      return;
    }

    this.unlockPageScroll();
  }
}