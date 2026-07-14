import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '../supabase/supabase';
import {
  Contact,
  ContactRow,
  CreateContact,
  UpdateContact,
} from '../models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly tableName = 'contacts';
  private readonly supabase = inject(SupabaseService).client;

  selectedContact = signal<Contact | null>(null);
  allContacts = signal<Contact[]>([]);

  async getContacts(): Promise<Contact[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) {
      throw error;
    }

    return this.sortContacts(this.mapContactRows((data ?? []) as ContactRow[]));
  }

  async getContactById(id: string): Promise<Contact | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? this.mapContactRow(data as ContactRow) : null;
  }

  async createContact(contact: CreateContact): Promise<Contact> {
    const badgeColor = await this.createUniqueBadgeColor();
    const { data, error } = await this.insertContact(contact, badgeColor);

    if (error) {
      throw error;
    }

    const createdContact = this.mapContactRow(data as ContactRow);
    this.addContactToState(createdContact);
    this.selectedContact.set(createdContact);

    return createdContact;
  }

  async updateContact(id: string, contact: UpdateContact): Promise<Contact> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(this.createUpdatePayload(contact))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const updatedContact = this.mapContactRow(data as ContactRow);
    this.updateContactInState(updatedContact);

    return updatedContact;
  }

  async deleteContact(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    this.removeContactFromState(id);
  }

  getInitials(firstName: string, lastName: string): string {
    const firstInitial = firstName.trim().charAt(0);
    const lastInitial = lastName.trim().charAt(0);

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  private async insertContact(contact: CreateContact, badgeColor: string) {
    return this.supabase
      .from(this.tableName)
      .insert(this.createInsertPayload(contact, badgeColor))
      .select()
      .single();
  }

  private createInsertPayload(
    contact: CreateContact,
    badgeColor: string
  ): Partial<ContactRow> {
    return {
      first_name: contact.firstName.trim(),
      last_name: contact.lastName.trim(),
      email: contact.email.trim(),
      phone: contact.phone?.trim() || null,
      badge_color: badgeColor,
    };
  }

  private createUpdatePayload(contact: UpdateContact): Partial<ContactRow> {
    return {
      ...(contact.firstName !== undefined && { first_name: contact.firstName.trim() }),
      ...(contact.lastName !== undefined && { last_name: contact.lastName.trim() }),
      ...(contact.email !== undefined && { email: contact.email.trim() }),
      ...(contact.phone !== undefined && { phone: contact.phone?.trim() || null }),
      updated_at: new Date().toISOString(),
    };
  }

  private addContactToState(contact: Contact): void {
    this.allContacts.update((contacts) => {
      return this.sortContacts([...contacts, contact]);
    });
  }

  private updateContactInState(updatedContact: Contact): void {
    this.selectedContact.set(updatedContact);
    this.allContacts.update((contacts) => {
      return this.replaceContact(contacts, updatedContact);
    });
  }

  private replaceContact(contacts: Contact[], updatedContact: Contact): Contact[] {
    const updatedContacts = contacts.map((contact) => {
      return contact.id === updatedContact.id ? updatedContact : contact;
    });

    return this.sortContacts(updatedContacts);
  }

  private removeContactFromState(contactId: string): void {
    this.allContacts.update((contacts) => {
      return contacts.filter((contact) => contact.id !== contactId);
    });

    if (this.selectedContact()?.id === contactId) {
      this.selectedContact.set(null);
    }
  }

  private async createUniqueBadgeColor(): Promise<string> {
    const usedColors = await this.getUsedBadgeColors();

    for (let attempt = 0; attempt < 20; attempt++) {
      const badgeColor = this.createRandomBadgeColor();

      if (!usedColors.has(badgeColor)) {
        return badgeColor;
      }
    }

    return this.createRandomBadgeColor();
  }

  private async getUsedBadgeColors(): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('badge_color');

    if (error) {
      throw error;
    }

    return new Set((data ?? []).map((contact) => contact.badge_color));
  }

  private createRandomBadgeColor(): string {
    const hue = this.getRandomNumber(0, 359);
    const saturation = this.getRandomNumber(65, 80);
    const lightness = this.getRandomNumber(38, 46);

    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  }

  private getRandomNumber(minimum: number, maximum: number): number {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  }

  private mapContactRows(contactRows: ContactRow[]): Contact[] {
    return contactRows.map((contactRow) => this.mapContactRow(contactRow));
  }

  private mapContactRow(contactRow: ContactRow): Contact {
    return {
      id: contactRow.id,
      firstName: contactRow.first_name,
      lastName: contactRow.last_name,
      email: contactRow.email,
      phone: contactRow.phone,
      badgeColor: contactRow.badge_color,
      createdAt: contactRow.created_at,
      updatedAt: contactRow.updated_at,
    };
  }

  private sortContacts(contacts: Contact[]): Contact[] {
    return [...contacts].sort((firstContact, secondContact) => {
      return this.compareContacts(firstContact, secondContact);
    });
  }

  private compareContacts(firstContact: Contact, secondContact: Contact): number {
    return (
      firstContact.firstName.localeCompare(secondContact.firstName) ||
      firstContact.lastName.localeCompare(secondContact.lastName)
    );
  }
}