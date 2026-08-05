import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactList } from './contact-list';

/** Contact-service surface required by the component tests. */
interface ContactServiceMock {
  selectedContact: WritableSignal<Contact | null>;
  allContacts: WritableSignal<Contact[]>;
  getContacts: Mock<() => Promise<Contact[]>>;
  getInitials: Mock<(firstName: string, lastName: string) => string>;
}

/** Contacts used to verify loading and rendering behavior. */
const mockContacts: Contact[] = [
  {
    id: '1',
    authUserId: 'user-123',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max@test.com',
    phone: null,
    badgeColor: '#ff0000',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: '2',
    authUserId: 'user-456',
    firstName: 'Erika',
    lastName: 'Musterfrau',
    email: 'erika@example.com',
    phone: null,
    badgeColor: '#00ff00',
    createdAt: '2023-02-15T09:30:00Z',
    updatedAt: '2023-02-15T09:30:00Z',
  },
  {
    id: '3',
    authUserId: 'user-789',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@provider.org',
    phone: '0123456789',
    badgeColor: '#0000ff',
    createdAt: '2023-03-10T14:45:00Z',
    updatedAt: '2023-03-10T14:45:00Z',
  },
  {
    id: '4',
    authUserId: 'user-000',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah@resistance.com',
    phone: '9876543210',
    badgeColor: '#ffaa00',
    createdAt: '2023-04-20T10:00:00Z',
    updatedAt: '2023-04-20T10:00:00Z',
  },
  {
    id: '5',
    authUserId: 'user-111',
    firstName: 'Peter',
    lastName: 'Pan',
    email: 'peter@neverland.com',
    phone: null,
    badgeColor: '#880088',
    createdAt: '2023-05-05T08:00:00Z',
    updatedAt: '2023-05-05T08:00:00Z',
  },
];

let component: ContactList;
let fixture: ComponentFixture<ContactList>;
let mockContactService: ContactServiceMock;

/**
 * Creates the contact-service mock used by the test module.
 * @returns A fresh contact-service mock.
 */
function createContactServiceMock(): ContactServiceMock {
  return {
    selectedContact: signal<Contact | null>(null),
    allContacts: signal<Contact[]>([]),
    getContacts: vi.fn<() => Promise<Contact[]>>().mockResolvedValue(mockContacts),
    getInitials: vi.fn((firstName, lastName) => {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }),
  };
}

/** Configures the standalone contact-list testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [ContactList],
    providers: [{ provide: ContactService, useValue: mockContactService }],
  }).compileComponents();
}

/** Creates and renders a contact-list fixture. */
async function setupComponent(): Promise<void> {
  mockContactService = createContactServiceMock();
  await configureTestBed();
  fixture = TestBed.createComponent(ContactList);
  component = fixture.componentInstance;
  fixture.detectChanges();
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies loading contacts into the component state. */
async function shouldLoadContacts(): Promise<void> {
  await component.loadContacts();
  fixture.detectChanges();
  expect(component.contacts()).toEqual(mockContacts);
  expect(component.isLoading()).toBe(false);
}

/** Verifies the create-contact output emitted by the desktop button. */
function shouldRequestContactCreation(): void {
  const emitSpy = vi.spyOn(component.createContactRequested, 'emit');
  const button = fixture.debugElement.query(By.css('.contact__button'));
  expect(button).toBeTruthy();
  button.triggerEventHandler('click', null);
  expect(emitSpy).toHaveBeenCalled();
}

/** Registers all contact-list component tests. */
function registerContactListTests(): void {
  beforeEach(setupComponent);
  it('should create the component', shouldCreateComponent);
  it('should call loadContacts and populate the list', shouldLoadContacts);
  it('should emit createContactRequested when the button is clicked', shouldRequestContactCreation);
}

describe('ContactList Component', registerContactListTests);