import { Component, OnInit, inject, output, signal } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';

/**
 * Loads and displays the alphabetically grouped contact list.
 *
 * Coordinates contact selection and forwards requests to open the contact
 * creation dialog.
 */
@Component({
  selector: 'app-contact-list',
  imports: [],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
export class ContactList implements OnInit {
  /** Emits when the contact creation dialog should be opened. */
  createContactRequested = output<void>();

  /** Service exposing contact state and loading operations. */
  private readonly contactService = inject(ContactService);

  /** Contact currently selected in shared contact state. */
  selectedContact = this.contactService.selectedContact;

  /** Complete contact collection exposed by shared contact state. */
  contacts = this.contactService.allContacts;

  /** Indicates whether the contact list is currently loading. */
  isLoading = signal(true);

  /** User-facing message describing the latest loading failure. */
  errorMessage = signal('');

  /**
   * Loads contacts when the component initializes.
   *
   * @returns A promise that resolves after the initial loading attempt.
   */
  async ngOnInit(): Promise<void> {
    await this.loadContacts();
  }

  /**
   * Loads the contact collection and exposes loading or error state.
   *
   * @returns A promise that resolves after the loading attempt.
   */
  async loadContacts(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      this.contacts.set(await this.contactService.getContacts());
    } catch {
      this.errorMessage.set('Contacts could not be loaded.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Requests opening the contact creation dialog.
   */
  openCreateDialog(): void {
    this.createContactRequested.emit();
  }

  /**
   * Stores a contact as the current shared selection.
   *
   * @param contact - Contact selected by the user.
   */
  getContact(contact: Contact): void {
    this.contactService.selectedContact.set(contact);
  }

  /**
   * Creates the initials displayed in a contact badge.
   *
   * @param firstName - The first name of the contact.
   * @param lastName - The last name of the contact.
   * @returns The contact's initials.
   */
  getInitials(firstName: string, lastName: string): string {
    return this.contactService.getInitials(firstName, lastName);
  }

  /**
   * Checks whether a new alphabetical group begins at an index.
   *
   * @param index - Index of the contact to inspect.
   * @returns True when a letter header should be rendered.
   */
  shouldShowLetterHeader(index: number): boolean {
    if (index === 0) {
      return true;
    }

    return this.getContactLetter(index) !== this.getContactLetter(index - 1);
  }

  /**
   * Resolves the uppercase first-name initial used for grouping.
   *
   * @param index - Index of the requested contact.
   * @returns Uppercase first letter of the contact's first name.
   */
  private getContactLetter(index: number): string {
    return this.contacts()[index].firstName.charAt(0).toUpperCase();
  }
}