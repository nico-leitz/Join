import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { ContactList } from '../../components/contact-list/contact-list';
import { ContactCreateDialog } from '../../components/contact-create-dialog/contact-create-dialog';
import { ContactEditDialog } from '../../components/contact-edit-dialog/contact-edit-dialog';
import { ContactSuccessOverlay } from '../../components/contact-success-overlay/contact-success-overlay';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactDetail } from "../../components/contact-detail/contact-detail";
import {
  Contact,
  CreateContact,
  UpdateContact,
} from '../../../../core/models/contact.model';
import { Sidebar } from "../../../../layout/sidebar/sidebar";
import { Header } from '../../../../layout/header/header';
import { MobileNav } from "../../../../layout/mobile-nav/mobile-nav";

@Component({
  selector: 'app-contacts',
  imports: [
    ContactList,
    ContactCreateDialog,
    ContactEditDialog,
    ContactSuccessOverlay,
    ContactDetail,
    Sidebar,
    Header,
    MobileNav
],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts implements OnDestroy {
  @ViewChild(ContactList) private contactList?: ContactList;

  private readonly document = inject(DOCUMENT);

  isCreateDialogOpen = signal(false);
  isEditDialogOpen = signal(false);
  selectedContact = signal<Contact | null>(null);
  successMessage = signal('');

  constructor(private readonly contactService: ContactService) {}

  ngOnDestroy(): void {
    this.unlockPageScroll();
  }

  openCreateDialog(): void {
    this.isCreateDialogOpen.set(true);
    this.lockPageScroll();
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen.set(false);
    this.updatePageScrollLock();
  }

  openEditDialog(contact: Contact): void {
    this.selectedContact.set(contact);
    this.isEditDialogOpen.set(true);
    this.lockPageScroll();
  }

  closeEditDialog(): void {
    this.isEditDialogOpen.set(false);
    this.selectedContact.set(null);
    this.updatePageScrollLock();
  }

  async createContact(contact: CreateContact): Promise<void> {
    await this.contactService.createContact(contact);
    this.closeCreateDialog();
    await this.contactList?.loadContacts();
    this.showSuccessMessage('Contact successfully created');
  }

  async updateContact(contact: UpdateContact): Promise<void> {
    const selectedContact = this.selectedContact();

    if (!selectedContact) return;

    await this.contactService.updateContact(selectedContact.id, contact);
    this.closeEditDialog();
    await this.contactList?.loadContacts();
    this.showSuccessMessage('Contact successfully updated');
  }

  hideSuccessMessage(): void {
    this.successMessage.set('');
  }

  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);

    setTimeout(() => {
      this.hideSuccessMessage();
    }, 2500);
  }

  private lockPageScroll(): void {
    this.document.body.classList.add('dialog-open');
  }

  private unlockPageScroll(): void {
    this.document.body.classList.remove('dialog-open');
  }

  private updatePageScrollLock(): void {
    const hasOpenDialog = this.isCreateDialogOpen() || this.isEditDialogOpen();

    if (hasOpenDialog) {
      this.lockPageScroll();
      return;
    }

    this.unlockPageScroll();
  }
}