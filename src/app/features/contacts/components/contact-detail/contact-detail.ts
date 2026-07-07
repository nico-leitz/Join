import { Component, inject, signal } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-contact-detail',
  imports: [],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  supabase = inject(SupabaseService)
  contactService = inject(ContactService)

  contacts = signal<Contact[]>([]);

  async ngOnInit() {
    try {
      const getContacts = await this.contactService.getContacts();
      const sortContacts = await this.sortContacts(getContacts);
      this.contacts.set(sortContacts)
    }
    catch(error) {
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

