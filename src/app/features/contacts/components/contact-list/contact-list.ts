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

  selectedContact = this.contactService.selectedContact;
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
      this.contacts.set(await this.contactService.getContacts());
    } catch {
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

  getInitials(firstName: string, lastName: string): string {
    return this.contactService.getInitials(firstName, lastName);
  }

  shouldShowLetterHeader(index: number): boolean {
    if (index === 0) {
      return true;
    }

    return this.getContactLetter(index) !== this.getContactLetter(index - 1);
  }

  private getContactLetter(index: number): string {
    return this.contacts()[index].firstName.charAt(0).toUpperCase();
  }
}