import { Injectable, inject, signal} from '@angular/core';
import { SupabaseService } from '../supabase/supabase';
import {
  Contact,
  ContactRow,
  CreateContact,
  UpdateContact,
} from '../models/contact.model';
import { Contacts } from '../../features/contacts/pages/contacts/contacts';

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

    if (error) throw error;

    return this.mapContactRows(data ?? []);
  }

  async getContactById(id: string): Promise<Contact | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    return data ? this.mapContactRow(data as ContactRow) : null;
  }

  async createContact(contact: CreateContact): Promise<Contact> {
    const badgeColor = await this.createUniqueBadgeColor();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        phone: contact.phone ?? null,
        badge_color: badgeColor,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapContactRow(data as ContactRow);
  }

  async updateContact(id: string, contact: UpdateContact): Promise<Contact> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(this.createUpdatePayload(contact))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapContactRow(data as ContactRow);
  }

  async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.allContacts.set(
        this.allContacts().filter(contact => contact.id !== id)
      );

      if (this.selectedContact()?.id === id) {
        this.selectedContact.set(null);
      }

    } catch (error) {
      console.error('Deletion error:', error);
    }
 }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  private createUpdatePayload(contact: UpdateContact): Partial<ContactRow> {
    return {
      ...(contact.firstName !== undefined && { first_name: contact.firstName }),
      ...(contact.lastName !== undefined && { last_name: contact.lastName }),
      ...(contact.email !== undefined && { email: contact.email }),
      ...(contact.phone !== undefined && { phone: contact.phone }),
      updated_at: new Date().toISOString(),
    };
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

    if (error) throw error;

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
}