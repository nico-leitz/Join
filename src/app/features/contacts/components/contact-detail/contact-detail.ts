import { Component, inject, output, signal } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';

/**
 * Displays the selected contact and coordinates its available actions.
 *
 * Provides edit, delete and back requests while managing the animated mobile
 * action menu.
 */
@Component({
  selector: 'app-contact-detail',
  imports: [],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  /** Duration of the mobile menu closing animation in milliseconds. */
  private readonly mobileMenuAnimationMs = 180;

  /** Identifier of the pending mobile menu close timer. */
  private mobileMenuCloseTimeoutId: number | null = null;

  /** Emits when the contact detail view should navigate back. */
  backRequested = output<void>();

  /** Emits the contact selected for editing. */
  editContactRequested = output<Contact>();

  /** Indicates whether the mobile action menu is visible. */
  isMobileActionMenuOpen = signal(false);

  /** Indicates whether the mobile action menu is currently closing. */
  isMobileActionMenuClosing = signal(false);

  /** Service exposing contact state and persistence operations. */
  private readonly contactService = inject(ContactService);

  /** Contact currently selected in shared contact state. */
  contact = this.contactService.selectedContact;

  /** Complete contact collection exposed by shared contact state. */
  contacts = this.contactService.allContacts;

  /**
   * Creates the initials displayed in a contact badge.
   * @param firstName - The first name of the contact.
   * @param lastName - The last name of the contact.
   * @returns The contact's initials.
   */
  getInitials(firstName: string, lastName: string): string {
    return this.contactService.getInitials(firstName, lastName);
  }

  /**
   * Requests editing for the selected contact.
   * @param contact - Contact that should be edited.
   */
  openEditDialog(contact: Contact): void {
    this.editContactRequested.emit(contact);
  }

  /**
   * Opens the mobile action menu or starts closing an open menu.
   */
  toggleMobileActionMenu(): void {
    if (this.isMobileActionMenuOpen()) {
      this.closeMobileActionMenu();
      return;
    }

    this.clearMobileMenuCloseTimeout();
    this.isMobileActionMenuClosing.set(false);
    this.isMobileActionMenuOpen.set(true);
  }

  /**
   * Starts the mobile action menu closing animation when possible.
   */
  closeMobileActionMenu(): void {
    if (!this.isMobileActionMenuOpen() || this.isMobileActionMenuClosing()) {
      return;
    }

    this.isMobileActionMenuClosing.set(true);
    this.clearMobileMenuCloseTimeout();
    this.mobileMenuCloseTimeoutId = window.setTimeout(() => {
      this.isMobileActionMenuOpen.set(false);
      this.isMobileActionMenuClosing.set(false);
      this.mobileMenuCloseTimeoutId = null;
    }, this.mobileMenuAnimationMs);
  }

  /**
   * Closes the mobile action menu immediately and clears its timer.
   */
  closeMobileActionMenuImmediately(): void {
    this.clearMobileMenuCloseTimeout();
    this.isMobileActionMenuOpen.set(false);
    this.isMobileActionMenuClosing.set(false);
  }

  /**
   * Closes the mobile menu and requests editing for a contact.
   * @param contact - The contact to edit.
   */
  editFromMobileMenu(contact: Contact): void {
    this.closeMobileActionMenuImmediately();
    this.openEditDialog(contact);
  }

  /**
   * Closes the mobile menu and deletes the selected contact.
   * @param contactId - Identifier of the contact to delete.
   * @returns A promise that resolves after deletion and navigation.
   * @throws The contact deletion error returned by the contact service.
   */
  async deleteFromMobileMenu(contactId: string): Promise<void> {
    this.closeMobileActionMenuImmediately();
    await this.deleteContact(contactId);
  }

  /**
   * Deletes a contact and returns to the contact list.
   * @param contactId - Identifier of the contact to delete.
   * @returns A promise that resolves after deletion and navigation.
   * @throws The contact deletion error returned by the contact service.
   */
  async deleteContact(contactId: string): Promise<void> {
    await this.contactService.deleteContact(contactId);
    this.goBack();
  }

  /**
   * Clears the current selection and requests navigation back to the list.
   */
  goBack(): void {
    this.closeMobileActionMenuImmediately();
    this.contactService.selectedContact.set(null);
    this.backRequested.emit();
  }

  /**
   * Cancels and clears the pending mobile menu close timer.
   */
  private clearMobileMenuCloseTimeout(): void {
    if (this.mobileMenuCloseTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.mobileMenuCloseTimeoutId);
    this.mobileMenuCloseTimeoutId = null;
  }
}