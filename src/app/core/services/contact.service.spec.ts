/**
 * @fileoverview Tests for the ContactService.
 * Checks if data loading, mapping, and state updates work as expected.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from './contact.service';
import { SupabaseService } from '../supabase/supabase';
import { Contact, ContactRow } from '../models/contact.model';

/**
 * @constant MOCK_DB_ROWS
 * @description Fake database rows with snake_case properties to simulate the Supabase response.
 */
const MOCK_DB_ROWS: ContactRow[] = [
  {
    id: '1',
    auth_user_id: 'user-123',
    first_name: 'Max',
    last_name: 'Mustermann',
    email: 'max@test.com',
    phone: '0123456789',
    badge_color: '#ff0000',
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
  },
  {
    id: '2',
    auth_user_id: 'user-456',
    first_name: 'Anna',
    last_name: 'Müller',
    email: 'anna@test.com',
    phone: null,
    badge_color: '#00ff00',
    created_at: '2023-02-01T12:00:00Z',
    updated_at: '2023-02-01T12:00:00Z',
  }
];

/**
 * @constant MOCK_APP_CONTACTS
 * @description Fake application contacts with camelCase properties for state testing.
 */
const MOCK_APP_CONTACTS: Contact[] = [
  {
    id: '1',
    authUserId: 'user-123',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max@test.com',
    phone: '0123456789',
    badgeColor: '#ff0000',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: '2',
    authUserId: 'user-456',
    firstName: 'Anna',
    lastName: 'Müller',
    email: 'anna@test.com',
    phone: null,
    badgeColor: '#00ff00',
    createdAt: '2023-02-01T12:00:00Z',
    updatedAt: '2023-02-01T12:00:00Z',
  }
];

/**
 * @description Test suite for the ContactService.
 */
describe('ContactService', () => {
  let service: ContactService;
  let mockSupabaseClient: any;

  /**
   * @description Sets up the test environment before each test.
   * Creates a mock Supabase client and configures the testing module.
   */
  beforeEach(() => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ContactService,
        { 
          provide: SupabaseService, 
          useValue: { client: mockSupabaseClient } 
        }
      ]
    });

    service = TestBed.inject(ContactService);
  });

  /**
   * @test Checks if the service is created successfully.
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * @test Verifies that getInitials returns the correct uppercase initials and trims spaces.
   */
  it('should get initials correctly', () => {
    const initials = service.getInitials('Max ', ' Mustermann');
    expect(initials).toBe('MM');

    const initials2 = service.getInitials(' anna', 'müller ');
    expect(initials2).toBe('AM');
  });

  /**
   * @test Ensures that getContacts loads data and maps snake_case to camelCase.
   * @async
   */
  it('should load all contacts and map them correctly', async () => {
    const fakeDbResponse = { data: MOCK_DB_ROWS, error: null };
    
    mockSupabaseClient.order.mockResolvedValueOnce(fakeDbResponse);

    const result = await service.getContacts();

    expect(result.length).toBe(2);
    expect(result[0].firstName).toBe('Max');
    expect(result[0].authUserId).toBe('user-123');
  });

  /**
   * @test Verifies that an error is thrown if the database fails to load contacts.
   * @async
   */
  it('should throw an error if loading contacts fails', async () => {
    const fakeError = new Error('Database is down');
    mockSupabaseClient.order.mockResolvedValueOnce({ data: null, error: fakeError });

    await expect(service.getContacts()).rejects.toThrow('Database is down');
  });

  /**
   * @test Ensures that a single contact is loaded and mapped correctly.
   * @async
   */
  it('should load a single contact by id', async () => {
    const fakeDbResponse = { data: MOCK_DB_ROWS[0], error: null };
    mockSupabaseClient.maybeSingle.mockResolvedValueOnce(fakeDbResponse);

    const result = await service.getContactById('1');

    expect(result).not.toBeNull();
    expect(result?.firstName).toBe('Max');
    
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
  });

  /**
   * @test Checks if null is returned when a contact does not exist in the database.
   * @async
   */
  it('should return null if contact is not found', async () => {
    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await service.getContactById('999');

    expect(result).toBeNull();
  });

  /**
   * @test Verifies that deleting a contact removes it from the list and clears the selection.
   * @async
   */
  it('should delete a contact and update the local state', async () => {
    service.allContacts.set([...MOCK_APP_CONTACTS]);
    service.selectedContact.set(MOCK_APP_CONTACTS[0]);

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ 
      data: { id: '1' }, 
      error: null 
    });

    await service.deleteContact('1');

    const contactsNow = service.allContacts();
    expect(contactsNow.length).toBe(1);
    expect(contactsNow[0].id).toBe('2');

    expect(service.selectedContact()).toBeNull();
  });
});