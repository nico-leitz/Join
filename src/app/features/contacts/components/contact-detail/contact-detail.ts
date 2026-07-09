import { Component, inject, output } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-contact-detail',
  imports: [],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  backRequested = output<void>();
  editContactRequested = output<Contact>();

  private readonly contactService = inject(ContactService);

  contact = this.contactService.selectedContact;
  contacts = this.contactService.allContacts;

  getInitials(firstName: string, lastName: string): string {
    return this.contactService.getInitials(firstName, lastName);
  }

  openEditDialog(contact: Contact): void {
    this.editContactRequested.emit(contact);
  }

  async deleteContact(contactId: string): Promise<void> {
    await this.contactService.deleteContact(contactId);
    this.goBack();
  }

  goBack(): void {
    this.contactService.selectedContact.set(null);
    this.backRequested.emit();
  }
}
