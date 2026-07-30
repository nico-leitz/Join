/**
 * @fileoverview Unit tests for the ContactService.
 * Validates data fetching, state management, and contact data mapping.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from './contact.service';
import { SupabaseService } from '../supabase/supabase';
import { Contact, ContactRow } from '../models/contact.model';

/**
 * @constant MOCK_DB_ROWS
 * @description Mock data representing raw database response in snake_case.
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
 * @description Mock data representing application state in camelCase.
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
  let mockQueryChain: any;

  /**
   * @description Sets up the test environment, mocking the Supabase query builder chain.
   */
  beforeEach(() => {
    mockQueryChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve({ data: [], error: null }))
    };

    const mockSupabaseClient = { from: vi.fn().mockReturnValue(mockQueryChain) };

    TestBed.configureTestingModule({
      providers: [
        ContactService,
        { provide: SupabaseService, useValue: { client: mockSupabaseClient } }
      ]
    });

    service = TestBed.inject(ContactService);
  });

  /**
   * @test Verifies dependency injection and service instantiation.
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * @test Validates logic for initials generation.
   */
  it('should get initials correctly', () => {
    expect(service.getInitials('Max ', ' Mustermann')).toBe('MM');
    expect(service.getInitials(' anna', 'müller ')).toBe('AM');
  });

  /**
   * @test Ensures contact data is loaded and mapped correctly, accounting for alphabetical sorting.
   */
  it('should load all contacts and map them correctly', async () => {
    mockQueryChain.then = vi.fn((resolve) => resolve({ data: MOCK_DB_ROWS, error: null }));

    const result = await service.getContacts();

    expect(result.length).toBe(2);
    // Anna (A) is sorted before Max (M)
    expect(result[0].firstName).toBe('Anna');
    expect(result[0].authUserId).toBe('user-456');
  });

  /**
   * @test Ensures proper error handling when service request fails.
   */
  it('should throw an error if loading contacts fails', async () => {
    mockQueryChain.then = vi.fn((resolve) => resolve({ data: null, error: new Error('Database is down') }));
    await expect(service.getContacts()).rejects.toThrow('Database is down');
  });

  /**
   * @test Validates single contact retrieval.
   */
  it('should load a single contact by id', async () => {
    mockQueryChain.then = vi.fn((resolve) => resolve({ data: MOCK_DB_ROWS[0], error: null }));
    const result = await service.getContactById('1');
    expect(result?.firstName).toBe('Max');
  });

  /**
   * @test Validates behavior when a contact is not found.
   */
  it('should return null if contact is not found', async () => {
    mockQueryChain.then = vi.fn((resolve) => resolve({ data: null, error: null }));
    expect(await service.getContactById('999')).toBeNull();
  });

  /**
   * @test Validates contact deletion and state update.
   */
  it('should delete a contact and update the local state', async () => {
    service.allContacts.set([...MOCK_APP_CONTACTS]);
    service.selectedContact.set(MOCK_APP_CONTACTS[0]);
    mockQueryChain.then = vi.fn((resolve) => resolve({ data: { id: '1' }, error: null }));

    await service.deleteContact('1');
    expect(service.allContacts().length).toBe(1);
    expect(service.selectedContact()).toBeNull();
  });
});