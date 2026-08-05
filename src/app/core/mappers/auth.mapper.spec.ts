import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createAuthUserMetadata, mapAuthUser } from './auth.mapper';

describe('createAuthUserMetadata', registerMetadataTests);
describe('mapAuthUser', registerUserMappingTests);

/** Registers the authentication metadata mapper tests. */
function registerMetadataTests(): void {
  it('normalizes and splits a complete name', testCompleteName);
  it('uses Unknown when only a first name is provided', testFirstNameOnly);
  it('creates safe fallback values for an empty name', testEmptyName);
}

/** Verifies normalization and splitting of a complete name. */
function testCompleteName(): void {
  const result = createAuthUserMetadata('  Bastian   Peter Wollny  ');

  expect(result).toEqual({
    first_name: 'Bastian',
    last_name: 'Peter Wollny',
    full_name: 'Bastian Peter Wollny',
  });
}

/** Verifies the last-name fallback for a single name. */
function testFirstNameOnly(): void {
  const result = createAuthUserMetadata('Bastian');

  expect(result).toEqual({
    first_name: 'Bastian',
    last_name: 'Unknown',
    full_name: 'Bastian',
  });
}

/** Verifies safe fallback values for an empty name. */
function testEmptyName(): void {
  const result = createAuthUserMetadata('   ');

  expect(result).toEqual({
    first_name: 'User',
    last_name: 'Unknown',
    full_name: '',
  });
}

/** Registers the authentication user mapper tests. */
function registerUserMappingTests(): void {
  it('maps normalized full-name metadata', testFullNameMetadata);
  it('combines separate name metadata', testSeparateNameMetadata);
  it('uses Guest for anonymous users without name metadata', testGuestFallback);
  it('uses User for permanent users without name metadata', testUserFallback);
}

/** Verifies normalization of full-name metadata. */
function testFullNameMetadata(): void {
  const user = createUser({ user_metadata: { full_name: '  Bastian   Wollny  ' } });
  const result = mapAuthUser(user);

  expect(result).toEqual({
    id: 'user-1',
    email: 'bastian@example.com',
    fullName: 'Bastian Wollny',
    isAnonymous: false,
  });
}

/** Verifies combination of separate first- and last-name metadata. */
function testSeparateNameMetadata(): void {
  const user = createUser({
    user_metadata: { first_name: 'Bastian', last_name: 'Wollny' },
  });
  const result = mapAuthUser(user);

  expect(result.fullName).toBe('Bastian Wollny');
}

/** Verifies anonymous user fallbacks. */
function testGuestFallback(): void {
  const user = createUser({
    id: 'guest-1',
    email: undefined,
    is_anonymous: true,
  });
  const result = mapAuthUser(user);

  expect(result).toEqual({
    id: 'guest-1',
    email: null,
    fullName: 'Guest',
    isAnonymous: true,
  });
}

/** Verifies permanent user fallbacks. */
function testUserFallback(): void {
  const result = mapAuthUser(createUser({ email: undefined }));

  expect(result.email).toBeNull();
  expect(result.fullName).toBe('User');
  expect(result.isAnonymous).toBe(false);
}

/**
 * Creates a complete Supabase user fixture with optional property overrides.
 * @param overrides - User properties that replace the fixture defaults.
 * @returns Complete Supabase user fixture.
 */
function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    aud: 'authenticated',
    email: 'bastian@example.com',
    created_at: '2026-07-27T10:00:00.000Z',
    app_metadata: {},
    user_metadata: {},
    is_anonymous: false,
    ...overrides,
  };
}