import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Contact } from '../../../../core/models/contact.model';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactDetail } from './contact-detail';

let component: ContactDetail;
let fixture: ComponentFixture<ContactDetail>;
let mockContactService: Pick<
  ContactService,
  'selectedContact' | 'allContacts' | 'getInitials' | 'deleteContact'
>;

/** Contacts used to exercise contact-detail interactions. */
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
function createContactServiceMock(): typeof mockContactService {
  return {
    selectedContact: signal<Contact | null>(mockContacts[0]),
    allContacts: signal<Contact[]>(mockContacts),
    getInitials: vi.fn(() => 'AS'),
    deleteContact: vi.fn(async () => undefined),
  };
}

/** Configures the standalone contact-detail testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [ContactDetail],
    providers: [{ provide: ContactService, useValue: mockContactService }],
  }).compileComponents();
}

/** Creates a rendered contact-detail fixture with fake timers. */
async function setupComponent(): Promise<void> {
  mockContactService = createContactServiceMock();
  await configureTestBed();
  vi.useFakeTimers();
  fixture = TestBed.createComponent(ContactDetail);
  component = fixture.componentInstance;
  fixture.detectChanges();
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

/** Verifies delegation of initials creation to the contact service. */
function shouldGetInitialsFromService(): void {
  const initials = component.getInitials('Alice', 'Smith');
  expect(mockContactService.getInitials).toHaveBeenCalledWith('Alice', 'Smith');
  expect(initials).toBe('AS');
}

/** Verifies emission of the contact selected for editing. */
function shouldEmitContactForEditing(): void {
  const emitSpy = vi.spyOn(component.editContactRequested, 'emit');
  component.openEditDialog(mockContacts[0]);
  expect(emitSpy).toHaveBeenCalledWith(mockContacts[0]);
}

/** Verifies opening the closed mobile action menu. */
function shouldOpenMobileMenu(): void {
  component.isMobileActionMenuOpen.set(false);
  component.toggleMobileActionMenu();
  expect(component.isMobileActionMenuOpen()).toBe(true);
  expect(component.isMobileActionMenuClosing()).toBe(false);
}

/** Verifies the delayed mobile-menu closing transition. */
function shouldAnimateMobileMenuClosing(): void {
  component.isMobileActionMenuOpen.set(true);
  component.closeMobileActionMenu();
  expect(component.isMobileActionMenuClosing()).toBe(true);
  expect(component.isMobileActionMenuOpen()).toBe(true);
  vi.advanceTimersByTime(180);
  expect(component.isMobileActionMenuClosing()).toBe(false);
  expect(component.isMobileActionMenuOpen()).toBe(false);
}

/** Verifies immediate mobile-menu closing without animation. */
function shouldCloseMobileMenuImmediately(): void {
  component.isMobileActionMenuOpen.set(true);
  component.isMobileActionMenuClosing.set(true);
  component.closeMobileActionMenuImmediately();
  expect(component.isMobileActionMenuOpen()).toBe(false);
  expect(component.isMobileActionMenuClosing()).toBe(false);
}

/** Verifies mobile-menu closing and edit-event emission. */
function shouldEditFromMobileMenu(): void {
  const editSpy = vi.spyOn(component.editContactRequested, 'emit');
  const closeSpy = vi.spyOn(component, 'closeMobileActionMenuImmediately');
  component.editFromMobileMenu(mockContacts[1]);
  expect(closeSpy).toHaveBeenCalled();
  expect(editSpy).toHaveBeenCalledWith(mockContacts[1]);
}

/** Verifies clearing the selection and emitting the back request. */
function shouldNavigateBack(): void {
  const backEmitSpy = vi.spyOn(component.backRequested, 'emit');
  const closeSpy = vi.spyOn(component, 'closeMobileActionMenuImmediately');
  component.goBack();
  expect(closeSpy).toHaveBeenCalled();
  expect(mockContactService.selectedContact()).toBeNull();
  expect(backEmitSpy).toHaveBeenCalled();
}

/** Verifies contact deletion followed by back navigation. */
async function shouldDeleteContactAndNavigateBack(): Promise<void> {
  const goBackSpy = vi.spyOn(component, 'goBack');
  await component.deleteContact('1');
  expect(mockContactService.deleteContact).toHaveBeenCalledWith('1');
  expect(goBackSpy).toHaveBeenCalled();
}

/** Registers contact-detail display and menu tests. */
function registerDisplayTests(): void {
  it('should create the component', shouldCreateComponent);
  it('should call the contact service to get initials', shouldGetInitialsFromService);
  it('should emit the contact when openEditDialog is called', shouldEmitContactForEditing);
  it('should open the mobile menu if it is currently closed', shouldOpenMobileMenu);
  it(
    'should start closing animation and then close the mobile menu',
    shouldAnimateMobileMenuClosing,
  );
  it(
    'should close the mobile menu immediately without animation',
    shouldCloseMobileMenuImmediately,
  );
}

/** Registers contact-detail action tests. */
function registerActionTests(): void {
  it(
    'should close mobile menu and emit edit event when editing from mobile menu',
    shouldEditFromMobileMenu,
  );
  it(
    'should close menu, clear selected contact, and emit back event when goBack is called',
    shouldNavigateBack,
  );
  it(
    'should call delete on service and navigate back when deleting a contact',
    shouldDeleteContactAndNavigateBack,
  );
}

/** Registers all contact-detail component tests. */
function registerContactDetailTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerDisplayTests();
  registerActionTests();
}

describe('ContactDetail', registerContactDetailTests);