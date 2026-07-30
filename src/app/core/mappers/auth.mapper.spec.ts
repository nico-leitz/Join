import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import {
  createAuthUserMetadata,
  mapAuthUser,
} from './auth.mapper';

describe('createAuthUserMetadata', () => {
  it('normalizes and splits a complete name', () => {
    const result = createAuthUserMetadata(
      '  Bastian   Peter Wollny  '
    );

    expect(result).toEqual({
      first_name: 'Bastian',
      last_name: 'Peter Wollny',
      full_name: 'Bastian Peter Wollny',
    });
  });

  it('uses Unknown when only a first name is provided', () => {
    const result = createAuthUserMetadata('Bastian');

    expect(result).toEqual({
      first_name: 'Bastian',
      last_name: 'Unknown',
      full_name: 'Bastian',
    });
  });

  it('creates safe fallback values for an empty name', () => {
    const result = createAuthUserMetadata('   ');

    expect(result).toEqual({
      first_name: 'User',
      last_name: 'Unknown',
      full_name: '',
    });
  });
});

describe('mapAuthUser', () => {
  it('maps normalized full-name metadata', () => {
    const result = mapAuthUser(
      createUser({
        user_metadata: {
          full_name: '  Bastian   Wollny  ',
        },
      })
    );

    expect(result).toEqual({
      id: 'user-1',
      email: 'bastian@example.com',
      fullName: 'Bastian Wollny',
      isAnonymous: false,
    });
  });

  it('combines separate name metadata', () => {
    const result = mapAuthUser(
      createUser({
        user_metadata: {
          first_name: 'Bastian',
          last_name: 'Wollny',
        },
      })
    );

    expect(result.fullName).toBe('Bastian Wollny');
  });

  it('uses Guest for anonymous users without name metadata', () => {
    const result = mapAuthUser(
      createUser({
        id: 'guest-1',
        email: undefined,
        is_anonymous: true,
      })
    );

    expect(result).toEqual({
      id: 'guest-1',
      email: null,
      fullName: 'Guest',
      isAnonymous: true,
    });
  });

  it('uses User for permanent users without name metadata', () => {
    const result = mapAuthUser(
      createUser({
        email: undefined,
      })
    );

    expect(result.email).toBeNull();
    expect(result.fullName).toBe('User');
    expect(result.isAnonymous).toBe(false);
  });
});

/**
 * Creates a complete Supabase user fixture with optional property overrides.
 *
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