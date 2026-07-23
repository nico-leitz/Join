import { Component, OnInit, inject, output, signal } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';

/**
 * Component for displaying a list of contacts.
 * 
 * @remarks
 * This component manages the retrieval and display of the contact list,
 * handles selection states, and provides alphabetical grouping functionality.
 * 
 * @public
 */
@Component({
  selector: 'app-contact-list',
  imports: [],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
export class ContactList implements OnInit {
  /** 
   * Event emitted when the user requests to create a new contact.
   * @public 
   */
  createContactRequested = output<void>();

  /** 
   * Service handling business logic and state for contacts.
   * @private 
   */
  private readonly contactService = inject(ContactService);

  /** 
   * The currently selected contact.
   * @public 
   */
  selectedContact = this.contactService.selectedContact;

  /** 
   * The complete list of contacts.
   * @public 
   */
  contacts = this.contactService.allContacts;

  /** 
   * Loading state signal.
   * @public 
   */
  isLoading = signal(true);

  /** 
   * Error message signal for request failures.
   * @public 
   */
  errorMessage = signal('');

  /**
   * Lifecycle hook to initialize the contact list loading.
   * @public
   */
  async ngOnInit(): Promise<void> {
    await this.loadContacts();
  }

  /**
   * Fetches the contact list from the service and handles the loading state.
   * 
   * @returns A promise that resolves when the contact fetch operation completes.
   * @public
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
   * Emits the create contact request output.
   * @public
   */
  openCreateDialog(): void {
    this.createContactRequested.emit();
  }

  /**
   * Updates the selected contact in the service.
   * 
   * @param contact - The contact to select.
   * @public
   */
  getContact(contact: Contact): void {
    this.contactService.selectedContact.set(contact);
  }

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
   * Determines if a letter-based header should be shown for a contact index.
   * 
   * @param index - The index of the current contact in the list.
   * @returns True if the header should be rendered, false otherwise.
   * @public
   */
  shouldShowLetterHeader(index: number): boolean {
    if (index === 0) {
      return true;
    }

    return this.getContactLetter(index) !== this.getContactLetter(index - 1);
  }

  /**
   * Helper to retrieve the first letter of a contact's first name for grouping.
   * 
   * @param index - The index of the contact.
   * @returns The first letter of the first name, uppercase.
   * @private
   */
  private getContactLetter(index: number): string {
    return this.contacts()[index].firstName.charAt(0).toUpperCase();
  }
}