import { Component, inject, signal } from '@angular/core';
import { ContactService } from '../../../../core/services/contact.service';
import { Contact } from '../../../../core/models/contact.model';
import { SupabaseService } from '../../../../core/supabase/supabase';

@Component({
  selector: 'app-contact-list',
  imports: [],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
export class ContactList {
  supabase = inject(SupabaseService);
  contactService = inject(ContactService);

  contacts = signal<Contact[]>([]);

  async ngOnInit() {
    try {
      const getContacts = await this.contactService.getContacts();
      const sortedContact = await this.sortContacts(getContacts);
      this.contacts.set(sortedContact);
      
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte in der Liste:', error);
    }
  }

  sortContacts(contactsArray: Contact[]) {
    return [...contactsArray].sort((a, b) => {
      return a.firstName.localeCompare(b.firstName);
    });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}
