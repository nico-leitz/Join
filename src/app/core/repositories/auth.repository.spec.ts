import { TestBed } from '@angular/core/testing';
import type { Session, User } from '@supabase/supabase-js';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { SupabaseService } from '../supabase/supabase';
import {
  AuthRepository,
  AuthStateChangeCallback,
} from './auth.repository';

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let signUpMock: ReturnType<typeof vi.fn>;
  let signInMock: ReturnType<typeof vi.fn>;
  let guestSignInMock: ReturnType<typeof vi.fn>;
  let getSessionMock: ReturnType<typeof vi.fn>;
  let authStateChangeMock: ReturnType<typeof vi.fn>;
  let signOutMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    signUpMock = vi.fn();
    signInMock = vi.fn();
    guestSignInMock = vi.fn();
    getSessionMock = vi.fn();
    authStateChangeMock = vi.fn();
    signOutMock = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AuthRepository,
        {
          provide: SupabaseService,
          useValue: {
            client: {
              auth: {
                signUp: signUpMock,
                signInWithPassword: signInMock,
                signInAnonymously: guestSignInMock,
                getSession: getSessionMock,
                onAuthStateChange: authStateChangeMock,
                signOut: signOutMock,
              },
            },
          },
        },
      ],
    });

    repository = TestBed.inject(AuthRepository);
  });

  it('registers a user with normalized metadata', async () => {
    const user = createUser();
    const session = createSession(user);

    signUpMock.mockResolvedValue({
      data: { user, session },
      error: null,
    });

    const result = await repository.signUp({
      fullName: '  Bastian   Wollny  ',
      email: '  bastian@example.com  ',
      password: 'Secure123!',
    });

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'bastian@example.com',
      password: 'Secure123!',
      options: {
        data: {
          first_name: 'Bastian',
          last_name: 'Wollny',
          full_name: 'Bastian Wollny',
        },
      },
    });
    expect(result).toEqual({ user, session });
  });

  it('signs in with a trimmed email address', async () => {
    const user = createUser();
    const session = createSession(user);

    signInMock.mockResolvedValue({
      data: { user, session },
      error: null,
    });

    const result = await repository.signIn({
      email: '  bastian@example.com  ',
      password: 'Secure123!',
    });

    expect(signInMock).toHaveBeenCalledWith({
      email: 'bastian@example.com',
      password: 'Secure123!',
    });
    expect(result).toEqual({ user, session });
  });

  it('signs in an anonymous guest', async () => {
    const user = createGuestUser();
    const session = createSession(user);

    guestSignInMock.mockResolvedValue({
      data: { user, session },
      error: null,
    });

    const result = await repository.signInAnonymously();

    expect(guestSignInMock).toHaveBeenCalledOnce();
    expect(result).toEqual({ user, session });
  });

  it('returns the persisted session', async () => {
    const session = createSession(createUser());

    getSessionMock.mockResolvedValue({
      data: { session },
      error: null,
    });

    const result = await repository.getSession();

    expect(getSessionMock).toHaveBeenCalledOnce();
    expect(result).toBe(session);
  });

  it('subscribes to authentication state changes', () => {
    const callback = vi.fn() as unknown as AuthStateChangeCallback;
    const subscription = { unsubscribe: vi.fn() };

    authStateChangeMock.mockReturnValue({
      data: { subscription },
    });

    const result = repository.onAuthStateChange(callback);

    expect(authStateChangeMock).toHaveBeenCalledWith(callback);
    expect(result).toBe(subscription);
  });

  it('signs out the active session', async () => {
    signOutMock.mockResolvedValue({ error: null });

    await expect(repository.signOut()).resolves.toBeUndefined();

    expect(signOutMock).toHaveBeenCalledOnce();
  });
});

/**
 * Creates a complete permanent Supabase user fixture.
 */
function createUser(): User {
  return {
    id: 'user-1',
    aud: 'authenticated',
    email: 'bastian@example.com',
    created_at: '2026-07-27T10:00:00.000Z',
    app_metadata: {},
    user_metadata: {
      full_name: 'Bastian Wollny',
    },
    is_anonymous: false,
  };
}

/**
 * Creates a complete anonymous Supabase user fixture.
 */
function createGuestUser(): User {
  return {
    id: 'guest-1',
    aud: 'authenticated',
    created_at: '2026-07-27T10:00:00.000Z',
    app_metadata: {},
    user_metadata: {},
    is_anonymous: true,
  };
}

/**
 * Creates a complete Supabase session fixture.
 */
function createSession(user: User): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: 1893459600,
    token_type: 'bearer',
    user,
  };
}