/**
 * @fileoverview Test suite for the ContactList component.
 * This file contains both the mock data and the test logic for component testing.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactList } from './contact-list';
import { ContactService } from '../../../../core/services/contact.service';
import { Contact } from '../../../../core/models/contact.model';

/**
 * @constant MOCK_CONTACTS
 * @description Example data for tests to cover various scenarios (e.g., missing phone numbers).
 */
const MOCK_CONTACTS: Contact[] = [
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
  }
];

/**
 * @description Test suite for the ContactList component.
 * Tests component initialization, data loading, and user interactions.
 */
describe('ContactList Component', () => {
  let component: ContactList;
  let fixture: ComponentFixture<ContactList>;
  let mockContactService: any;

  /**
   * Prepares the test environment before each test.
   * Configures the test module, injects mocks, and compiles resources.
   */
  beforeEach(async () => {
    // Mock service definition using Vitest spies
    mockContactService = {
      selectedContact: signal(null),
      allContacts: signal([]),
      getContacts: vi.fn(),
      getInitials: vi.fn(function(f: string, l: string) {
        const firstLetter = f[0];
        const lastLetter = l[0];
        const combined = firstLetter + lastLetter;
        
        return combined.toUpperCase();
      }),
      contacts: signal(MOCK_CONTACTS) 
    };

    await TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [ContactList],
      providers: [
        { provide: ContactService, useValue: mockContactService }
      ],
    })
    // compileComponents() forces the resolution of external templates/styles (JIT mode)
    .compileComponents();

    fixture = TestBed.createComponent(ContactList);
    component = fixture.componentInstance;
    
    fixture.detectChanges();
  });

  /**
   * @test Checks if the component was successfully instantiated.
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Validates that the component correctly loads contacts from the service.
   * @async
   */
  it('should call loadContacts and populate the list', async () => {
    mockContactService.getContacts.mockResolvedValue(MOCK_CONTACTS);
    
    await component.loadContacts();
    fixture.detectChanges();

    expect(component.contacts()).toEqual(MOCK_CONTACTS);
    expect(component.isLoading()).toBe(false);
  });

  /**
   * @test Checks if the 'createContactRequested' event is emitted when the button is clicked.
   */
  it('should emit createContactRequested when the button is clicked', () => {
    const emitSpy = vi.spyOn(component.createContactRequested, 'emit');

    const button = fixture.debugElement.query(By.css('.contact__button'));
    
    if (button) {
      button.triggerEventHandler('click', null);
      expect(emitSpy).toHaveBeenCalled();
    } else {
      throw new Error('Button .contact__button was not found in the template.');
    }
  });
});