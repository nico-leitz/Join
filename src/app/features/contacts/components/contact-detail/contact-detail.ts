import { Component, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-contact-detail',
  imports: [],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  supabase = inject(SupabaseService);
  contactService = inject(ContactService);

  contact = this.contactService.selectedContact;

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}
