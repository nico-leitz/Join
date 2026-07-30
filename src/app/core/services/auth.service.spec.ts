import { TestBed } from '@angular/core/testing';
import {
  AuthApiError,
  Session,
  User,
} from '@supabase/supabase-js';
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

    signUpMock.mockResolvedValue({
      user,
      session: null,
    });

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

  it('maps a sign-up error to a safe message', async () => {
    signUpMock.mockRejectedValue(
      createAuthApiError('email_exists')
    );

    const result = await authService.signUp(
      createSignUpCredentials()
    );

    expect(result).toBeNull();
    expect(authService.errorMessage()).toBe(
      'An account with this email already exists.'
    );
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.isLoading()).toBe(false);
  });

  it('maps invalid credentials during sign-in', async () => {
    signInMock.mockRejectedValue(
      createAuthApiError('invalid_credentials')
    );

    const result = await authService.signIn(
      createLoginCredentials()
    );

    expect(result).toBe(false);
    expect(authService.errorMessage()).toBe(
      'Invalid email or password.'
    );
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.isLoading()).toBe(false);
  });

  it('maps an unavailable anonymous provider', async () => {
    guestSignInMock.mockRejectedValue(
      createAuthApiError('anonymous_provider_disabled')
    );

    const result = await authService.signInAsGuest();

    expect(result).toBe(false);
    expect(authService.errorMessage()).toBe(
      'Guest login is currently unavailable.'
    );
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.isLoading()).toBe(false);
  });

  it('rejects a sign-in response without a session', async () => {
    const user = createUser();

    signInMock.mockResolvedValue({
      user,
      session: null,
    });

    const result = await authService.signIn(
      createLoginCredentials()
    );

    expect(result).toBe(false);
    expect(authService.errorMessage()).toBe(
      'Authentication failed. Please try again.'
    );
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.isLoading()).toBe(false);
  });

  it('keeps the authenticated user when sign-out fails', async () => {
    const user = createUser();

    signInMock.mockResolvedValue({
      user,
      session: createSession(user),
    });
    signOutMock.mockRejectedValue(new Error('Sign-out failed'));

    await authService.signIn(createLoginCredentials());
    const result = await authService.signOut();

    expect(result).toBe(false);
    expect(authService.currentUser()?.id).toBe('user-1');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.errorMessage()).toBe(
      'Authentication failed. Please try again.'
    );
    expect(authService.isLoading()).toBe(false);
  });

  it('completes initialization after session restoration fails', async () => {
    getSessionMock.mockRejectedValue(
      createAuthApiError('session_expired')
    );

    await authService.initialize();

    expect(getSessionMock).toHaveBeenCalledOnce();
    expect(authStateChangeMock).toHaveBeenCalledOnce();
    expect(authService.isInitialized()).toBe(true);
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.errorMessage()).toBe(
      'Your session has expired. Please log in again.'
    );
  });
});

/**
 * Creates valid registration test data.
 *
 * @param privacyAccepted - Privacy acceptance state assigned to the fixture.
 * @returns Complete registration credentials for service tests.
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
 *
 * @returns Complete login credentials for service tests.
 */
function createLoginCredentials(): LoginCredentials {
  return {
    email: 'bastian@example.com',
    password: 'Secure123!',
  };
}

/**
 * Creates a Supabase authentication error fixture.
 *
 * @param code - Supabase authentication error code.
 * @returns Authentication error containing the provided code.
 */
function createAuthApiError(code: string): AuthApiError {
  return new AuthApiError(
    'Test authentication error',
    400,
    code
  );
}

/**
 * Creates a complete permanent Supabase user fixture.
 *
 * @returns Permanent Supabase user fixture.
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
 *
 * @returns Anonymous Supabase user fixture.
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
 *
 * @param user - User associated with the session.
 * @returns Supabase session fixture for the provided user.
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