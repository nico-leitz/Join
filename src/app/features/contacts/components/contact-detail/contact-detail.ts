import { Component, inject, output, signal } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';

/**
 * Component for displaying the detailed view of a selected contact.
 * 
 * @remarks
 * This component manages the display of contact information, provides an interface
 * for editing or deleting contacts, and handles the responsive mobile action menu state.
 * 
 * @public
 */
@Component({
  selector: 'app-contact-detail',
  imports: [],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  /** @internal Duration of the mobile menu closing animation in milliseconds. */
  private readonly mobileMenuAnimationMs = 180;
  
  /** @internal Timeout ID for the mobile menu closing operation. */
  private mobileMenuCloseTimeoutId: number | null = null;

  /** Event emitted when the user requests to navigate back. */
  backRequested = output<void>();

  /** Event emitted when the user requests to edit the contact. */
  editContactRequested = output<Contact>();

  /** Signal tracking if the mobile action menu is currently open. */
  isMobileActionMenuOpen = signal(false);

  /** Signal tracking if the mobile action menu is currently animating to close. */
  isMobileActionMenuClosing = signal(false);

  /** Service for accessing contact data and logic. */
  private readonly contactService = inject(ContactService);

  /** The currently selected contact data. */
  contact = this.contactService.selectedContact;

  /** The list of all available contacts. */
  contacts = this.contactService.allContacts;

  /**
   * Retrieves the initials for a given contact by delegating to the service.
   * 
   * @param firstName - The first name of the contact.
   * @param lastName - The last name of the contact.
   * @returns The contact's initials.
   * @public
   */
  getInitials(firstName: string, lastName: string): string {
    return this.contactService.getInitials(firstName, lastName);
  }

  /**
   * Emits the edit contact request output.
   * 
   * @param contact - The contact object to be edited.
   * @public
   */
  openEditDialog(contact: Contact): void {
    this.editContactRequested.emit(contact);
  }

  /**
   * Toggles the visibility of the mobile action menu.
   * @public
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
   * Triggers the closing animation for the mobile action menu.
   * @public
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
   * Immediately closes the mobile action menu without animation.
   * @public
   */
  closeMobileActionMenuImmediately(): void {
    this.clearMobileMenuCloseTimeout();
    this.isMobileActionMenuOpen.set(false);
    this.isMobileActionMenuClosing.set(false);
  }

  /**
   * Closes the menu and triggers the edit dialog.
   * 
   * @param contact - The contact to edit.
   * @public
   */
  editFromMobileMenu(contact: Contact): void {
    this.closeMobileActionMenuImmediately();
    this.openEditDialog(contact);
  }

  /**
   * Closes the menu and initiates contact deletion.
   * 
   * @param contactId - The ID of the contact to delete.
   * @returns A promise that resolves when the deletion is complete.
   * @public
   */
  async deleteFromMobileMenu(contactId: string): Promise<void> {
    this.closeMobileActionMenuImmediately();
    await this.deleteContact(contactId);
  }

  /**
   * Deletes a contact and returns to the previous view.
   * 
   * @param contactId - The ID of the contact to delete.
   * @returns A promise that resolves when the operation completes.
   * @public
   */
  async deleteContact(contactId: string): Promise<void> {
    await this.contactService.deleteContact(contactId);
    this.goBack();
  }

  /**
   * Clears selection, closes the mobile menu, and emits the back request.
   * @public
   */
  goBack(): void {
    this.closeMobileActionMenuImmediately();
    this.contactService.selectedContact.set(null);
    this.backRequested.emit();
  }

  /**
   * @internal Clears the timeout used for the mobile menu closing animation.
   */
  private clearMobileMenuCloseTimeout(): void {
    if (this.mobileMenuCloseTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.mobileMenuCloseTimeoutId);
    this.mobileMenuCloseTimeoutId = null;
  }
}