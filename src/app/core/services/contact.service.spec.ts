import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Contact, ContactRow } from '../models/contact.model';
import { SupabaseService } from '../supabase/supabase';
import { ContactService } from './contact.service';

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
  },
];

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
  },
];

const createQueryResolution = (data: unknown, error: Error | null = null) => {
  return vi.fn((resolve: (value: unknown) => unknown) => resolve({ data, error }));
};

const createQueryChain = () => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  then: createQueryResolution([]),
});

let service: ContactService;
let mockQueryChain: ReturnType<typeof createQueryChain>;

const configureTestBed = (): void => {
  mockQueryChain = createQueryChain();
  const client = { from: vi.fn().mockReturnValue(mockQueryChain) };
  TestBed.configureTestingModule({
    providers: [ContactService, { provide: SupabaseService, useValue: { client } }],
  });
  service = TestBed.inject(ContactService);
};

const shouldCreateService = (): void => {
  expect(service).toBeTruthy();
};

const shouldGetInitials = (): void => {
  expect(service.getInitials('Max ', ' Mustermann')).toBe('MM');
  expect(service.getInitials(' anna', 'müller ')).toBe('AM');
};

const shouldLoadContacts = async (): Promise<void> => {
  mockQueryChain.then = createQueryResolution(MOCK_DB_ROWS);
  const result = await service.getContacts();
  expect(result.length).toBe(2);
  expect(result[0].firstName).toBe('Anna');
  expect(result[0].authUserId).toBe('user-456');
};

const shouldRejectLoadingError = async (): Promise<void> => {
  mockQueryChain.then = createQueryResolution(null, new Error('Database is down'));
  await expect(service.getContacts()).rejects.toThrow('Database is down');
};

const shouldLoadContactById = async (): Promise<void> => {
  mockQueryChain.then = createQueryResolution(MOCK_DB_ROWS[0]);
  const result = await service.getContactById('1');
  expect(result?.firstName).toBe('Max');
};

const shouldReturnNullForMissingContact = async (): Promise<void> => {
  mockQueryChain.then = createQueryResolution(null);
  expect(await service.getContactById('999')).toBeNull();
};

const shouldDeleteContact = async (): Promise<void> => {
  service.allContacts.set([...MOCK_APP_CONTACTS]);
  service.selectedContact.set(MOCK_APP_CONTACTS[0]);
  mockQueryChain.then = createQueryResolution({ id: '1' });
  await service.deleteContact('1');
  expect(service.allContacts().length).toBe(1);
  expect(service.selectedContact()).toBeNull();
};

beforeEach(configureTestBed);

describe('ContactService', () => {
  it('should be created', shouldCreateService);
  it('should get initials correctly', shouldGetInitials);
});

describe('contact queries', () => {
  it('should load all contacts and map them correctly', shouldLoadContacts);
  it('should throw an error if loading contacts fails', shouldRejectLoadingError);
  it('should load a single contact by id', shouldLoadContactById);
  it('should return null if contact is not found', shouldReturnNullForMissingContact);
});

describe('contact mutations', () => {
  it('should delete a contact and update the local state', shouldDeleteContact);
});