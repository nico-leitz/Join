import { Injectable, inject, signal } from '@angular/core';
import {
  Contact,
  ContactRow,
  CreateContact,
  UpdateContact,
} from '../models/contact.model';
import { SupabaseService } from '../supabase/supabase';

/**
 * Manages contact persistence, mapping, sorting and application state.
 */
@Injectable({
  providedIn: 'root',
})
export class ContactService {
  /** Name of the contact database table. */
  private readonly tableName = 'contacts';

  /** Supabase client used for contact persistence requests. */
  private readonly supabase = inject(SupabaseService).client;

  /** Currently selected contact or null when no contact is selected. */
  selectedContact = signal<Contact | null>(null);

  /** Complete sorted contact collection held in application state. */
  allContacts = signal<Contact[]>([]);

  /**
   * Retrieves all contacts from the database.
   *
   * @returns Mapped contacts sorted by first and last name.
   * @throws The database error returned by Supabase.
   */
  async getContacts(): Promise<Contact[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) {
      throw error;
    }

    return this.sortContacts(
      this.mapContactRows((data ?? []) as ContactRow[]),
    );
  }

  /**
   * Retrieves a single contact by its identifier.
   *
   * @param id - Identifier of the requested contact.
   * @returns Mapped contact or null when the contact does not exist.
   * @throws The database error returned by Supabase.
   */
  async getContactById(
    id: string,
  ): Promise<Contact | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data
      ? this.mapContactRow(data as ContactRow)
      : null;
  }

  /**
   * Creates a contact and adds it to the local contact state.
   *
   * @param contact - Contact data to persist.
   * @returns Created and mapped contact.
   * @throws The database error returned by Supabase.
   */
  async createContact(
    contact: CreateContact,
  ): Promise<Contact> {
    const badgeColor =
      await this.createUniqueBadgeColor();
    const { data, error } =
      await this.insertContact(contact, badgeColor);

    if (error) {
      throw error;
    }

    const createdContact = this.mapContactRow(
      data as ContactRow,
    );
    this.addContactToState(createdContact);
    this.selectedContact.set(createdContact);

    return createdContact;
  }

  /**
   * Updates a contact and synchronizes the local contact state.
   *
   * @param id - Identifier of the contact to update.
   * @param contact - Contact fields to persist.
   * @returns Updated and mapped contact.
   * @throws The database error returned by Supabase.
   * @throws An error when no contact row was updated.
   */
  async updateContact(
    id: string,
    contact: UpdateContact,
  ): Promise<Contact> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(this.createUpdatePayload(contact))
      .eq('id', id)
      .select()
      .maybeSingle();

    const updatedRow = this.requireMutationRow(
      data as ContactRow | null,
      error,
      'updated',
    );
    const updatedContact =
      this.mapContactRow(updatedRow);
    this.updateContactInState(updatedContact);

    return updatedContact;
  }

  /**
   * Deletes a contact and removes it from the local contact state.
   *
   * @param id - Identifier of the contact to delete.
   * @returns A promise that resolves after deletion.
   * @throws The database error returned by Supabase.
   * @throws An error when no contact row was deleted.
   */
  async deleteContact(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    this.requireMutationRow(
      data,
      error,
      'deleted',
    );
    this.removeContactFromState(id);
  }

  /**
   * Creates uppercase initials from a contact name.
   *
   * @param firstName - Contact first name.
   * @param lastName - Contact last name.
   * @returns Combined first characters of the trimmed names.
   */
  getInitials(
    firstName: string,
    lastName: string,
  ): string {
    const firstInitial =
      firstName.trim().charAt(0);
    const lastInitial =
      lastName.trim().charAt(0);

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  /**
   * Inserts a contact row using normalized application data.
   *
   * @param contact - Contact data to persist.
   * @param badgeColor - Badge color assigned to the contact.
   * @returns Supabase response containing the inserted contact row.
   */
  private async insertContact(
    contact: CreateContact,
    badgeColor: string,
  ) {
    return this.supabase
      .from(this.tableName)
      .insert(
        this.createInsertPayload(
          contact,
          badgeColor,
        ),
      )
      .select()
      .single();
  }

  /**
   * Creates a normalized database payload for a new contact.
   *
   * @param contact - Contact data to transform.
   * @param badgeColor - Badge color assigned to the contact.
   * @returns Contact insert payload using database field names.
   */
  private createInsertPayload(
    contact: CreateContact,
    badgeColor: string,
  ): Partial<ContactRow> {
    return {
      first_name: contact.firstName.trim(),
      last_name: contact.lastName.trim(),
      email: contact.email.trim(),
      phone: contact.phone?.trim() || null,
      badge_color: badgeColor,
    };
  }

  /**
   * Creates a database payload containing the provided contact updates.
   *
   * @param contact - Contact fields to update.
   * @returns Normalized contact update payload with a new update timestamp.
   */
  private createUpdatePayload(
    contact: UpdateContact,
  ): Partial<ContactRow> {
    return {
      ...(contact.firstName !== undefined && {
        first_name: contact.firstName.trim(),
      }),
      ...(contact.lastName !== undefined && {
        last_name: contact.lastName.trim(),
      }),
      ...(contact.email !== undefined && {
        email: contact.email.trim(),
      }),
      ...(contact.phone !== undefined && {
        phone: contact.phone?.trim() || null,
      }),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Adds a contact to the local collection and restores sort order.
   *
   * @param contact - Contact to add.
   */
  private addContactToState(
    contact: Contact,
  ): void {
    this.allContacts.update((contacts) => {
      return this.sortContacts([
        ...contacts,
        contact,
      ]);
    });
  }

  /**
   * Replaces an existing contact in all relevant local state.
   *
   * @param updatedContact - Persisted contact containing the latest values.
   */
  private updateContactInState(
    updatedContact: Contact,
  ): void {
    this.selectedContact.set(updatedContact);
    this.allContacts.update((contacts) => {
      return this.replaceContact(
        contacts,
        updatedContact,
      );
    });
  }

  /**
   * Replaces a contact within a collection and sorts the result.
   *
   * @param contacts - Contact collection to update.
   * @param updatedContact - Contact containing the replacement values.
   * @returns Sorted collection containing the updated contact.
   */
  private replaceContact(
    contacts: Contact[],
    updatedContact: Contact,
  ): Contact[] {
    const updatedContacts = contacts.map(
      (contact) => {
        return contact.id === updatedContact.id
          ? updatedContact
          : contact;
      },
    );

    return this.sortContacts(updatedContacts);
  }

  /**
   * Removes a contact from local state and clears its selection when required.
   *
   * @param contactId - Identifier of the contact to remove.
   */
  private removeContactFromState(
    contactId: string,
  ): void {
    this.allContacts.update((contacts) => {
      return contacts.filter(
        (contact) => contact.id !== contactId,
      );
    });

    if (this.selectedContact()?.id === contactId) {
      this.selectedContact.set(null);
    }
  }

  /**
   * Ensures that a database mutation succeeded and returned a row.
   *
   * @param data - Row returned by the mutation.
   * @param error - Database error returned by Supabase.
   * @param action - Mutation action used in the fallback error message.
   * @returns Validated mutation row.
   * @throws The provided database error when one is present.
   * @throws An error when the mutation returned no row.
   */
  private requireMutationRow<T>(
    data: T | null,
    error: unknown,
    action: 'updated' | 'deleted',
  ): T {
    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        `Contact could not be ${action}.`,
      );
    }

    return data;
  }

  /**
   * Generates a badge color while attempting to avoid colors already in use.
   *
   * @returns Newly generated HSL badge color.
   * @throws The database error returned while loading used colors.
   */
  private async createUniqueBadgeColor():
    Promise<string> {
    const usedColors =
      await this.getUsedBadgeColors();

    for (
      let attempt = 0;
      attempt < 20;
      attempt++
    ) {
      const badgeColor =
        this.createRandomBadgeColor();

      if (!usedColors.has(badgeColor)) {
        return badgeColor;
      }
    }

    return this.createRandomBadgeColor();
  }

  /**
   * Retrieves all badge colors currently stored for contacts.
   *
   * @returns Set containing the stored badge colors.
   * @throws The database error returned by Supabase.
   */
  private async getUsedBadgeColors():
    Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('badge_color');

    if (error) {
      throw error;
    }

    return new Set(
      (data ?? []).map(
        (contact) => contact.badge_color,
      ),
    );
  }

  /**
   * Generates a badge color within the configured HSL ranges.
   *
   * @returns Random HSL color string.
   */
  private createRandomBadgeColor(): string {
    const hue = this.getRandomNumber(0, 359);
    const saturation =
      this.getRandomNumber(65, 80);
    const lightness =
      this.getRandomNumber(38, 46);

    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  }

  /**
   * Generates a random integer within an inclusive range.
   *
   * @param minimum - Lowest possible integer.
   * @param maximum - Highest possible integer.
   * @returns Random integer between the provided boundaries.
   */
  private getRandomNumber(
    minimum: number,
    maximum: number,
  ): number {
    return (
      Math.floor(
        Math.random() *
          (maximum - minimum + 1),
      ) + minimum
    );
  }

  /**
   * Maps multiple database contact rows to application contacts.
   *
   * @param contactRows - Contact rows to transform.
   * @returns Mapped application contacts.
   */
  private mapContactRows(
    contactRows: ContactRow[],
  ): Contact[] {
    return contactRows.map((contactRow) => {
      return this.mapContactRow(contactRow);
    });
  }

  /**
   * Maps a database contact row to the application contact model.
   *
   * @param contactRow - Contact row to transform.
   * @returns Mapped application contact.
   */
  private mapContactRow(
    contactRow: ContactRow,
  ): Contact {
    return {
      id: contactRow.id,
      authUserId: contactRow.auth_user_id,
      firstName: contactRow.first_name,
      lastName: contactRow.last_name,
      email: contactRow.email,
      phone: contactRow.phone,
      badgeColor: contactRow.badge_color,
      createdAt: contactRow.created_at,
      updatedAt: contactRow.updated_at,
    };
  }

  /**
   * Returns a copy of a contact collection sorted by name.
   *
   * @param contacts - Contacts to sort.
   * @returns Sorted contact collection.
   */
  private sortContacts(
    contacts: Contact[],
  ): Contact[] {
    return [...contacts].sort(
      (firstContact, secondContact) => {
        return this.compareContacts(
          firstContact,
          secondContact,
        );
      },
    );
  }

  /**
   * Compares two contacts by first name and then by last name.
   *
   * @param firstContact - First contact to compare.
   * @param secondContact - Second contact to compare.
   * @returns Locale comparison result used for sorting.
   */
  private compareContacts(
    firstContact: Contact,
    secondContact: Contact,
  ): number {
    return (
      firstContact.firstName.localeCompare(
        secondContact.firstName,
      ) ||
      firstContact.lastName.localeCompare(
        secondContact.lastName,
      )
    );
  }
}