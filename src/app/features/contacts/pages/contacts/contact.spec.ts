import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Contact, CreateContact, UpdateContact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactList } from '../../components/contact-list/contact-list';
import { Contacts } from './contacts';

/** Contact-service surface required by the contacts-page tests. */
type ContactServiceMock = Pick<
  ContactService,
  | 'selectedContact'
  | 'allContacts'
  | 'createContact'
  | 'updateContact'
  | 'deleteContact'
  | 'getContacts'
  | 'getInitials'
>;

let component: Contacts;
let fixture: ComponentFixture<Contacts>;
let mockContactService: ContactServiceMock;
let mockDocument: Document;
let mockContactList: ContactList;

/** Contacts used to exercise the page workflows. */
const mockContacts: Contact[] = [
  {
    id: '1',
    authUserId: 'user-001',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice.smith@example.com',
    phone: '123-456-7890',
    badgeColor: '#ff0000',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
  },
  {
    id: '2',
    authUserId: 'user-002',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.j@example.com',
    phone: null,
    badgeColor: '#00ff00',
    createdAt: '2023-02-15T09:30:00Z',
    updatedAt: '2023-02-15T09:30:00Z',
  },
  {
    id: '3',
    authUserId: 'user-003',
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie.b@example.com',
    phone: '555-0192',
    badgeColor: '#0000ff',
    createdAt: '2023-03-20T14:15:00Z',
    updatedAt: '2023-03-20T14:15:00Z',
  },
  {
    id: '4',
    authUserId: 'user-004',
    firstName: 'Diana',
    lastName: 'Prince',
    email: 'diana@amazon.com',
    phone: '987-654-3210',
    badgeColor: '#ff00ff',
    createdAt: '2023-04-10T11:00:00Z',
    updatedAt: '2023-04-10T11:00:00Z',
  },
  {
    id: '5',
    authUserId: 'user-005',
    firstName: 'Evan',
    lastName: 'Wright',
    email: 'evan.wright@test.org',
    phone: null,
    badgeColor: '#ffff00',
    createdAt: '2023-05-05T08:45:00Z',
    updatedAt: '2023-05-05T08:45:00Z',
  },
];

/**
 * Creates the contact-service test double.
 * @returns A contact-service mock with writable contact signals.
 */
function createContactServiceMock(): ContactServiceMock {
  return {
    selectedContact: signal<Contact | null>(null),
    allContacts: signal<Contact[]>(mockContacts),
    createContact: vi.fn(async () => mockContacts[0]),
    updateContact: vi.fn(async () => mockContacts[0]),
    deleteContact: vi.fn(async () => undefined),
    getContacts: vi.fn(async () => mockContacts),
    getInitials: vi.fn(() => 'AB'),
  };
}

/** Configures the standalone contacts-page testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [Contacts],
    providers: [{ provide: ContactService, useValue: mockContactService }, provideRouter([])],
  }).compileComponents();
}

/**
 * Gets the rendered contact-list child component.
 * @returns The contact-list instance rendered by the page fixture.
 */
function getContactList(): ContactList {
  return fixture.debugElement.query(By.directive(ContactList)).componentInstance as ContactList;
}

/** Creates a rendered contacts-page fixture and its spies. */
async function setupComponent(): Promise<void> {
  mockContactService = createContactServiceMock();
  await configureTestBed();
  mockDocument = TestBed.inject(DOCUMENT);
  vi.spyOn(mockDocument.body.classList, 'add');
  vi.spyOn(mockDocument.body.classList, 'remove');
  fixture = TestBed.createComponent(Contacts);
  component = fixture.componentInstance;
  fixture.detectChanges();
  mockContactList = getContactList();
  vi.spyOn(mockContactList, 'loadContacts').mockResolvedValue(undefined);
  vi.useFakeTimers();
}

/** Restores timers and spies after each test. */
function cleanUpComponent(): void {
  vi.useRealTimers();
  vi.restoreAllMocks();
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies opening the create dialog and locking page scroll. */
function shouldOpenCreateDialog(): void {
  component.openCreateDialog();
  expect(component.isCreateDialogOpen()).toBe(true);
  expect(mockDocument.body.classList.add).toHaveBeenCalledWith('dialog-open');
}

/** Verifies closing the create dialog and unlocking page scroll. */
function shouldCloseCreateDialog(): void {
  component.isCreateDialogOpen.set(true);
  component.closeCreateDialog();
  expect(component.isCreateDialogOpen()).toBe(false);
  expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('dialog-open');
}

/** Verifies selecting a contact and opening the edit dialog. */
function shouldOpenEditDialog(): void {
  const contactToEdit = mockContacts[1];
  component.openEditDialog(contactToEdit);
  expect(component.selectedContact()).toEqual(contactToEdit);
  expect(component.isEditDialogOpen()).toBe(true);
  expect(mockDocument.body.classList.add).toHaveBeenCalledWith('dialog-open');
}

/** Verifies the complete contact-creation workflow. */
async function shouldCreateContact(): Promise<void> {
  const contact: CreateContact = {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'test@test.com',
  };
  await component.createContact(contact);
  expect(mockContactService.createContact).toHaveBeenCalledWith(contact);
  expect(component.isCreateDialogOpen()).toBe(false);
  expect(mockContactList.loadContacts).toHaveBeenCalled();
  expect(component.successMessage()).toBe('Contact successfully created');
}

/** Verifies that updating stops without a selected contact. */
async function shouldNotUpdateWithoutSelection(): Promise<void> {
  const changes: UpdateContact = { firstName: 'Changed' };
  component.selectedContact.set(null);
  await component.updateContact(changes);
  expect(mockContactService.updateContact).not.toHaveBeenCalled();
}

/** Verifies the complete contact-update workflow. */
async function shouldUpdateContact(): Promise<void> {
  const activeContact = mockContacts[2];
  const changes: UpdateContact = { firstName: 'Updated Name' };
  component.selectedContact.set(activeContact);
  await component.updateContact(changes);
  expect(mockContactService.updateContact).toHaveBeenCalledWith(activeContact.id, changes);
  expect(component.isEditDialogOpen()).toBe(false);
  expect(mockContactList.loadContacts).toHaveBeenCalled();
  expect(component.successMessage()).toBe('Contact successfully updated');
}

/** Verifies the complete contact-deletion workflow. */
async function shouldDeleteContact(): Promise<void> {
  await component.deleteContact('123');
  expect(mockContactService.deleteContact).toHaveBeenCalledWith('123');
  expect(component.isEditDialogOpen()).toBe(false);
  expect(mockContactList.loadContacts).toHaveBeenCalled();
  expect(component.successMessage()).toBe('Contact successfully deleted');
}

/** Verifies automatic removal of the success message. */
async function shouldHideSuccessMessage(): Promise<void> {
  const contact: CreateContact = {
    firstName: 'Test',
    lastName: 'Contact',
    email: 'test@example.com',
  };
  component.openCreateDialog();
  await component.createContact(contact);
  expect(component.successMessage()).toBeTruthy();
  vi.advanceTimersByTime(2500);
  expect(component.successMessage()).toBe('');
}

/** Verifies page-scroll restoration when the component is destroyed. */
function shouldUnlockScrollOnDestroy(): void {
  component.ngOnDestroy();
  expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('dialog-open');
}

/** Registers contacts-page dialog tests. */
function registerDialogTests(): void {
  it('should create the component', shouldCreateComponent);
  it('should open create dialog and lock page scroll', shouldOpenCreateDialog);
  it('should close create dialog and unlock page scroll', shouldCloseCreateDialog);
  it('should open edit dialog, set selected contact, and lock scroll', shouldOpenEditDialog);
}

/** Registers contacts-page persistence tests. */
function registerPersistenceTests(): void {
  it('should create a contact, reload the list, and show success', shouldCreateContact);
  it('should not update when no contact is selected', shouldNotUpdateWithoutSelection);
  it('should update the selected contact and show success', shouldUpdateContact);
  it('should delete a contact, reload the list, and show success', shouldDeleteContact);
}

/** Registers contacts-page feedback and cleanup tests. */
function registerLifecycleTests(): void {
  it('should hide the success message after 2500ms', shouldHideSuccessMessage);
  it('should unlock page scroll when destroyed', shouldUnlockScrollOnDestroy);
}

/** Registers all contacts-page component tests. */
function registerContactsTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerDialogTests();
  registerPersistenceTests();
  registerLifecycleTests();
}

describe('Contacts Component', registerContactsTests);