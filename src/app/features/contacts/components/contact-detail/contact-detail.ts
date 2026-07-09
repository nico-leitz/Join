import { Component, inject, output, signal } from '@angular/core';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-contact-detail',
  imports: [],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  private readonly mobileMenuAnimationMs = 180;
  private mobileMenuCloseTimeoutId: number | null = null;

  backRequested = output<void>();
  editContactRequested = output<Contact>();
  isMobileActionMenuOpen = signal(false);
  isMobileActionMenuClosing = signal(false);

  private readonly contactService = inject(ContactService);

  contact = this.contactService.selectedContact;
  contacts = this.contactService.allContacts;

  getInitials(firstName: string, lastName: string): string {
    return this.contactService.getInitials(firstName, lastName);
  }

  openEditDialog(contact: Contact): void {
    this.editContactRequested.emit(contact);
  }

  toggleMobileActionMenu(): void {
    if (this.isMobileActionMenuOpen()) {
      this.closeMobileActionMenu();
      return;
    }

    this.clearMobileMenuCloseTimeout();
    this.isMobileActionMenuClosing.set(false);
    this.isMobileActionMenuOpen.set(true);
  }

  closeMobileActionMenu(): void {
    if (!this.isMobileActionMenuOpen() || this.isMobileActionMenuClosing()) {
      return;
    }

    this.isMobileActionMenuClosing.set(true);
    this.clearMobileMenuCloseTimeout();
    this.mobileMenuCloseTimeoutId = window.setTimeout(() => {
      this.isMobileActionMenuOpen.set(false);
      this.isMobileActionMenuClosing.set(false);
      this.mobileMenuCloseTimeoutId = null;
    }, this.mobileMenuAnimationMs);
  }

  closeMobileActionMenuImmediately(): void {
    this.clearMobileMenuCloseTimeout();
    this.isMobileActionMenuOpen.set(false);
    this.isMobileActionMenuClosing.set(false);
  }

  editFromMobileMenu(contact: Contact): void {
    this.closeMobileActionMenuImmediately();
    this.openEditDialog(contact);
  }

  async deleteFromMobileMenu(contactId: string): Promise<void> {
    this.closeMobileActionMenuImmediately();
    await this.deleteContact(contactId);
  }

  async deleteContact(contactId: string): Promise<void> {
    await this.contactService.deleteContact(contactId);
    this.goBack();
  }

  goBack(): void {
    this.closeMobileActionMenuImmediately();
    this.contactService.selectedContact.set(null);
    this.backRequested.emit();
  }

  private clearMobileMenuCloseTimeout(): void {
    if (this.mobileMenuCloseTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.mobileMenuCloseTimeoutId);
    this.mobileMenuCloseTimeoutId = null;
  }
}
