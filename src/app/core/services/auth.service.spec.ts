import { TestBed } from '@angular/core/testing';
import { Session, User } from '@supabase/supabase-js';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  LoginCredentials,
  SignUpCredentials,
} from '../models/auth.model';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let signUpMock: ReturnType<typeof vi.fn>;
  let signInMock: ReturnType<typeof vi.fn>;
  let guestSignInMock: ReturnType<typeof vi.fn>;
  let signOutMock: ReturnType<typeof vi.fn>;
  let getSessionMock: ReturnType<typeof vi.fn>;
  let authStateChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    signUpMock = vi.fn();
    signInMock = vi.fn();
    guestSignInMock = vi.fn();
    signOutMock = vi.fn();
    getSessionMock = vi.fn().mockResolvedValue(null);
    authStateChangeMock = vi.fn().mockReturnValue({
      unsubscribe: vi.fn(),
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            signUp: signUpMock,
            signIn: signInMock,
            signInAnonymously: guestSignInMock,
            signOut: signOutMock,
            getSession: getSessionMock,
            onAuthStateChange: authStateChangeMock,
          },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
  });

  it('starts with an unauthenticated state', () => {
    expect(authService.currentUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.isGuest()).toBe(false);
    expect(authService.isLoading()).toBe(false);
    expect(authService.isInitialized()).toBe(false);
    expect(authService.errorMessage()).toBeNull();
  });

  it('rejects sign-up without privacy acceptance', async () => {
    const credentials = createSignUpCredentials(false);

    const result = await authService.signUp(credentials);

    expect(result).toBeNull();
    expect(authService.errorMessage()).toBe(
      'Please accept the Privacy Policy.'
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('clears an existing authentication error', async () => {
    await authService.signUp(createSignUpCredentials(false));

    authService.clearError();

    expect(authService.errorMessage()).toBeNull();
  });

  it('returns email confirmation state after sign-up', async () => {
    const credentials = createSignUpCredentials();
    const user = createUser();
    signUpMock.mockResolvedValue({ user, session: null });

    const result = await authService.signUp(credentials);

    expect(result?.user.fullName).toBe('Bastian Wollny');
    expect(result?.requiresEmailConfirmation).toBe(true);
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.isLoading()).toBe(false);
  });

  it('signs in and exposes the authenticated user', async () => {
    const credentials = createLoginCredentials();
    const user = createUser();

    signInMock.mockResolvedValue({
      user,
      session: createSession(user),
    });

    const result = await authService.signIn(credentials);

    expect(result).toBe(true);
    expect(signInMock).toHaveBeenCalledWith(credentials);
    expect(authService.currentUser()?.id).toBe('user-1');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.isGuest()).toBe(false);
  });

  it('signs in as an anonymous guest', async () => {
    const user = createGuestUser();

    guestSignInMock.mockResolvedValue({
      user,
      session: createSession(user),
    });

    const result = await authService.signInAsGuest();

    expect(result).toBe(true);
    expect(guestSignInMock).toHaveBeenCalledOnce();
    expect(authService.currentUser()?.fullName).toBe('Guest');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.isGuest()).toBe(true);
  });

  it('restores a persisted session exactly once', async () => {
    const user = createUser();
    getSessionMock.mockResolvedValue(createSession(user));

    await Promise.all([
      authService.initialize(),
      authService.initialize(),
    ]);

    expect(getSessionMock).toHaveBeenCalledOnce();
    expect(authStateChangeMock).toHaveBeenCalledOnce();
    expect(authService.isInitialized()).toBe(true);
    expect(authService.currentUser()?.id).toBe('user-1');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('signs out and clears the authenticated user', async () => {
    const user = createUser();

    signInMock.mockResolvedValue({
      user,
      session: createSession(user),
    });
    signOutMock.mockResolvedValue(undefined);

    await authService.signIn(createLoginCredentials());
    const result = await authService.signOut();

    expect(result).toBe(true);
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(authService.currentUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });
});

/**
 * Creates valid registration test data.
 */
function createSignUpCredentials(
  privacyAccepted = true
): SignUpCredentials {
  return {
    fullName: 'Bastian Wollny',
    email: 'bastian@example.com',
    password: 'Secure123!',
    privacyAccepted,
  };
}

/**
 * Creates valid login test data.
 */
function createLoginCredentials(): LoginCredentials {
  return {
    email: 'bastian@example.com',
    password: 'Secure123!',
  };
}

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