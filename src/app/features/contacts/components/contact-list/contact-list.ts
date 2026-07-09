import { Component, OnInit, inject, output, signal } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-contact-list',
  imports: [],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
export class ContactList implements OnInit {
  createContactRequested = output<void>();

  private readonly contactService = inject(ContactService);

  contacts = this.contactService.allContacts;
  isLoading = signal(true);
  errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadContacts();
  }

  async loadContacts(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const contacts = await this.contactService.getContacts();
      const sortedContacts = this.sortContacts(contacts);

      this.contacts.set(sortedContacts);
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte in der Liste:', error);
      this.errorMessage.set('Kontakte konnten nicht geladen werden.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreateDialog(): void {
    this.createContactRequested.emit();
  }

  getContact(contact: Contact): void {
    this.contactService.selectedContact.set(contact);
  }

  sortContacts(contactsArray: Contact[]): Contact[] {
    return [...contactsArray].sort((a, b) => {
      return a.firstName.localeCompare(b.firstName);
    });
  }

  getInitials(firstName: string, lastName: string): string {
    return this.contactService.getInitials(firstName, lastName);
  }

  shouldShowLetterHeader(index: number): boolean {
    if (index === 0) return true;

    const contacts = this.contacts();
    const currentLetter = contacts[index].firstName.charAt(0).toUpperCase();
    const previousLetter = contacts[index - 1].firstName.charAt(0).toUpperCase();

    return currentLetter !== previousLetter;
  }
}