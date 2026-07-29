import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { Contacts } from './contacts';
import { ContactService } from '../../../../core/services/contact.service';
import { Contact } from '../../../../core/models/contact.model';

/**
 * @description Unit tests for the Contacts page component.
 * This suite verifies dialog states, service integration for CRUD operations, 
 * success message timeouts, and document body scroll locking.
 */
describe('Contacts Component', () => {
  let component: Contacts;
  let fixture: ComponentFixture<Contacts>;
  let mockContactService: any;
  let mockDocument: any;
  let mockContactList: any;

  /** 
   * Array of 5 mock contacts to simulate the data coming from the service. 
   */
  const MOCK_CONTACTS: Contact[] = [
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
    }
  ];

  beforeEach(async () => {
    mockContactService = {
      selectedContact: signal<Contact | null>(null),
      allContacts: signal<Contact[]>(MOCK_CONTACTS),
      createContact: vi.fn().mockResolvedValue(MOCK_CONTACTS[0]),
      updateContact: vi.fn().mockResolvedValue(undefined),
      deleteContact: vi.fn().mockResolvedValue(undefined),
      getInitials: vi.fn().mockReturnValue('AB')
    };

    await TestBed.configureTestingModule({
      imports: [Contacts],
      providers: [
        { provide: ContactService, useValue: mockContactService },
        provideRouter([])
      ]
    }).compileComponents();

    mockDocument = TestBed.inject(DOCUMENT);
    vi.spyOn(mockDocument.body.classList, 'add');
    vi.spyOn(mockDocument.body.classList, 'remove');

    fixture = TestBed.createComponent(Contacts);
    component = fixture.componentInstance;

    fixture.detectChanges(); 

    mockContactList = (component as any).contactList;
    vi.spyOn(mockContactList, 'loadContacts').mockResolvedValue(undefined);

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * @test Ensures the smart component initializes correctly.
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Verifies that opening the create dialog sets the signal and locks page scroll.
   */
  it('should open create dialog and lock page scroll', () => {
    component.openCreateDialog();

    expect(component.isCreateDialogOpen()).toBe(true);
    expect(mockDocument.body.classList.add).toHaveBeenCalledWith('dialog-open');
  });

  /**
   * @test Verifies that closing the create dialog updates the signal and unlocks scroll.
   */
  it('should close create dialog and unlock page scroll', () => {
    component.isCreateDialogOpen.set(true);
    
    component.closeCreateDialog();

    expect(component.isCreateDialogOpen()).toBe(false);
    expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('dialog-open');
  });

  /**
   * @test Ensures that opening the edit dialog sets the selected contact and locks scroll.
   */
  it('should open edit dialog, set selected contact, and lock scroll', () => {
    const contactToEdit = MOCK_CONTACTS[1];
    
    component.openEditDialog(contactToEdit);

    expect(component.selectedContact()).toEqual(contactToEdit);
    expect(component.isEditDialogOpen()).toBe(true);
    expect(mockDocument.body.classList.add).toHaveBeenCalledWith('dialog-open');
  });

  /**
   * @test Checks the full workflow of creating a contact.
   */
  it('should create a contact, close dialog, reload list, and show success message', async () => {
    const newContactData = { firstName: 'Alice', lastName: 'Smith', email: 'test@test.com' };
    
    await component.createContact(newContactData as any);

    expect(mockContactService.createContact).toHaveBeenCalledWith(newContactData);
    expect(component.isCreateDialogOpen()).toBe(false);
    expect(mockContactList.loadContacts).toHaveBeenCalled();
    expect(component.successMessage()).toBe('Contact successfully created');
  });

  /**
   * @test Verifies that the update process aborts if no contact is currently selected.
   */
  it('should not update contact if no contact is selected', async () => {
    component.selectedContact.set(null);
    
    await component.updateContact({ firstName: 'Changed' } as any);

    expect(mockContactService.updateContact).not.toHaveBeenCalled();
  });

  /**
   * @test Checks the full workflow of updating an existing contact.
   */
  it('should update the selected contact, close dialog, reload list, and show success', async () => {
    const activeContact = MOCK_CONTACTS[2];
    component.selectedContact.set(activeContact);
    
    const updateData = { firstName: 'Updated Name' };
    await component.updateContact(updateData as any);

    expect(mockContactService.updateContact).toHaveBeenCalledWith(activeContact.id, updateData);
    expect(component.isEditDialogOpen()).toBe(false);
    expect(mockContactList.loadContacts).toHaveBeenCalled();
    expect(component.successMessage()).toBe('Contact successfully updated');
  });

  /**
   * @test Tests the deletion workflow including service call and list reload.
   */
  it('should delete contact, close dialog, reload list, and show success', async () => {
    await component.deleteContact('123');

    expect(mockContactService.deleteContact).toHaveBeenCalledWith('123');
    expect(component.isEditDialogOpen()).toBe(false);
    expect(mockContactList.loadContacts).toHaveBeenCalled();
    expect(component.successMessage()).toBe('Contact successfully deleted');
  });

  /**
   * @test Ensures that the success message disappears automatically after 2.5 seconds.
   */
  it('should hide success message after 2500ms', async () => {
    component.openCreateDialog();
    await component.createContact({ firstName: 'Test' } as any); 
    
    expect(component.successMessage()).toBeTruthy();

    vi.advanceTimersByTime(2500);

    expect(component.successMessage()).toBe('');
  });

  /**
   * @test Checks that ngOnDestroy properly unlocks the page scroll to prevent bugs when leaving the page.
   */
  it('should unlock page scroll when component is destroyed', () => {
    component.ngOnDestroy();
    
    expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('dialog-open');
  });
});