import { TestBed } from '@angular/core/testing';
import { AuthApiError, Session, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginCredentials, SignUpCredentials } from '../models/auth.model';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthService } from './auth.service';

let authService: AuthService;
let signUpMock: ReturnType<typeof vi.fn>;
let signInMock: ReturnType<typeof vi.fn>;
let guestSignInMock: ReturnType<typeof vi.fn>;
let signOutMock: ReturnType<typeof vi.fn>;
let getSessionMock: ReturnType<typeof vi.fn>;
let authStateChangeMock: ReturnType<typeof vi.fn>;

describe('AuthService', registerAuthServiceTests);

/** Registers the AuthService test cases. */
function registerAuthServiceTests(): void {
  beforeEach(setUpAuthService);
  registerInitialAndSignUpTests();
  registerSignInAndSessionTests();
  registerAuthenticationErrorTests();
}

/** Registers initial-state and sign-up test cases. */
function registerInitialAndSignUpTests(): void {
  it('starts with an unauthenticated state', startsWithUnauthenticatedState);
  it('rejects sign-up without privacy acceptance', rejectsMissingPrivacyAcceptance);
  it('clears an existing authentication error', clearsAuthenticationError);
  it('signs up and exposes the authenticated user immediately', signsUpUser);
  it('rejects a sign-up response without an active session', rejectsSessionlessSignUp);
}

/** Registers sign-in and session test cases. */
function registerSignInAndSessionTests(): void {
  it('signs in and exposes the authenticated user', signsInUser);
  it('signs in as an anonymous guest', signsInGuest);
  it('restores a persisted session exactly once', restoresSessionOnce);
  it('signs out and clears the authenticated user', signsOutUser);
}

/** Registers authentication error test cases. */
function registerAuthenticationErrorTests(): void {
  it('maps a sign-up error to a safe message', mapsSignUpError);
  it('maps invalid credentials during sign-in', mapsInvalidCredentials);
  it('maps an unavailable anonymous provider', mapsUnavailableGuestProvider);
  it('rejects a sign-in response without a session', rejectsSessionlessSignIn);
  it('keeps the authenticated user when sign-out fails', keepsUserAfterFailedSignOut);
  it('completes initialization after session restoration fails', completesFailedInitialization);
}

/** Configures a fresh AuthService test instance. */
function setUpAuthService(): void {
  initializeRepositoryMocks();
  TestBed.configureTestingModule({
    providers: [AuthService, { provide: AuthRepository, useValue: createRepositoryMock() }],
  });
  authService = TestBed.inject(AuthService);
}

/** Initializes repository method mocks for one test. */
function initializeRepositoryMocks(): void {
  signUpMock = vi.fn();
  signInMock = vi.fn();
  guestSignInMock = vi.fn();
  signOutMock = vi.fn();
  getSessionMock = vi.fn().mockResolvedValue(null);
  authStateChangeMock = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
}

/**
 * Creates the repository double used by Angular dependency injection.
 * @returns Repository method mocks for the current test.
 */
function createRepositoryMock() {
  return {
    signUp: signUpMock,
    signIn: signInMock,
    signInAnonymously: guestSignInMock,
    signOut: signOutMock,
    getSession: getSessionMock,
    onAuthStateChange: authStateChangeMock,
  };
}

/** Verifies the initial unauthenticated state. */
function startsWithUnauthenticatedState(): void {
  expect(authService.currentUser()).toBeNull();
  expect(authService.isAuthenticated()).toBe(false);
  expect(authService.isGuest()).toBe(false);
  expect(authService.isLoading()).toBe(false);
  expect(authService.isInitialized()).toBe(false);
  expect(authService.errorMessage()).toBeNull();
}

/** Verifies that sign-up requires privacy acceptance. */
async function rejectsMissingPrivacyAcceptance(): Promise<void> {
  const credentials = createSignUpCredentials(false);
  const result = await authService.signUp(credentials);
  expect(result).toBe(false);
  expect(authService.errorMessage()).toBe('Please accept the Privacy Policy.');
  expect(signUpMock).not.toHaveBeenCalled();
}

/** Verifies that an existing authentication error can be cleared. */
async function clearsAuthenticationError(): Promise<void> {
  await authService.signUp(createSignUpCredentials(false));
  authService.clearError();
  expect(authService.errorMessage()).toBeNull();
}

/** Verifies successful user registration. */
async function signsUpUser(): Promise<void> {
  const credentials = createSignUpCredentials();
  const user = createUser();
  signUpMock.mockResolvedValue({ user, session: createSession(user) });
  const result = await authService.signUp(credentials);
  expect(result).toBe(true);
  expect(signUpMock).toHaveBeenCalledWith(credentials);
  expect(authService.currentUser()?.fullName).toBe('Bastian Wollny');
  expect(authService.isAuthenticated()).toBe(true);
  expect(authService.isLoading()).toBe(false);
}

/** Verifies that sign-up rejects a response without a session. */
async function rejectsSessionlessSignUp(): Promise<void> {
  const user = createUser();
  signUpMock.mockResolvedValue({ user, session: null });
  const result = await authService.signUp(createSignUpCredentials());
  expect(result).toBe(false);
  expect(authService.errorMessage()).toBe('Authentication failed. Please try again.');
  expect(authService.isAuthenticated()).toBe(false);
}

/** Verifies successful user sign-in. */
async function signsInUser(): Promise<void> {
  const credentials = createLoginCredentials();
  const user = createUser();
  signInMock.mockResolvedValue({ user, session: createSession(user) });
  const result = await authService.signIn(credentials);
  expect(result).toBe(true);
  expect(signInMock).toHaveBeenCalledWith(credentials);
  expect(authService.currentUser()?.id).toBe('user-1');
  expect(authService.isAuthenticated()).toBe(true);
  expect(authService.isGuest()).toBe(false);
}

/** Verifies successful anonymous guest sign-in. */
async function signsInGuest(): Promise<void> {
  const user = createGuestUser();
  guestSignInMock.mockResolvedValue({ user, session: createSession(user) });
  const result = await authService.signInAsGuest();
  expect(result).toBe(true);
  expect(guestSignInMock).toHaveBeenCalledOnce();
  expect(authService.currentUser()?.fullName).toBe('Guest');
  expect(authService.isAuthenticated()).toBe(true);
  expect(authService.isGuest()).toBe(true);
}

/** Verifies that concurrent initialization restores a session once. */
async function restoresSessionOnce(): Promise<void> {
  const user = createUser();
  getSessionMock.mockResolvedValue(createSession(user));
  await Promise.all([authService.initialize(), authService.initialize()]);
  expect(getSessionMock).toHaveBeenCalledOnce();
  expect(authStateChangeMock).toHaveBeenCalledOnce();
  expect(authService.isInitialized()).toBe(true);
  expect(authService.currentUser()?.id).toBe('user-1');
  expect(authService.isAuthenticated()).toBe(true);
}

/** Verifies successful user sign-out. */
async function signsOutUser(): Promise<void> {
  const user = createUser();
  signInMock.mockResolvedValue({ user, session: createSession(user) });
  signOutMock.mockResolvedValue(undefined);
  await authService.signIn(createLoginCredentials());
  const result = await authService.signOut();
  expect(result).toBe(true);
  expect(signOutMock).toHaveBeenCalledOnce();
  expect(authService.currentUser()).toBeNull();
  expect(authService.isAuthenticated()).toBe(false);
}

/** Verifies safe mapping of sign-up errors. */
async function mapsSignUpError(): Promise<void> {
  signUpMock.mockRejectedValue(createAuthApiError('email_exists'));
  const result = await authService.signUp(createSignUpCredentials());
  expect(result).toBe(false);
  expect(authService.errorMessage()).toBe('An account with this email already exists.');
  expect(authService.isAuthenticated()).toBe(false);
  expect(authService.isLoading()).toBe(false);
}

/** Verifies invalid-credential error mapping. */
async function mapsInvalidCredentials(): Promise<void> {
  signInMock.mockRejectedValue(createAuthApiError('invalid_credentials'));
  const result = await authService.signIn(createLoginCredentials());
  expect(result).toBe(false);
  expect(authService.errorMessage()).toBe('Invalid email or password.');
  expect(authService.isAuthenticated()).toBe(false);
  expect(authService.isLoading()).toBe(false);
}

/** Verifies unavailable guest-provider error mapping. */
async function mapsUnavailableGuestProvider(): Promise<void> {
  guestSignInMock.mockRejectedValue(createAuthApiError('anonymous_provider_disabled'));
  const result = await authService.signInAsGuest();
  expect(result).toBe(false);
  expect(authService.errorMessage()).toBe('Guest login is currently unavailable.');
  expect(authService.isAuthenticated()).toBe(false);
  expect(authService.isLoading()).toBe(false);
}

/** Verifies that sign-in rejects a response without a session. */
async function rejectsSessionlessSignIn(): Promise<void> {
  const user = createUser();
  signInMock.mockResolvedValue({ user, session: null });
  const result = await authService.signIn(createLoginCredentials());
  expect(result).toBe(false);
  expect(authService.errorMessage()).toBe('Authentication failed. Please try again.');
  expect(authService.isAuthenticated()).toBe(false);
  expect(authService.isLoading()).toBe(false);
}

/** Verifies that a failed sign-out preserves the current user. */
async function keepsUserAfterFailedSignOut(): Promise<void> {
  const user = createUser();
  signInMock.mockResolvedValue({ user, session: createSession(user) });
  signOutMock.mockRejectedValue(new Error('Sign-out failed'));
  await authService.signIn(createLoginCredentials());
  const result = await authService.signOut();
  expect(result).toBe(false);
  expect(authService.currentUser()?.id).toBe('user-1');
  expect(authService.isAuthenticated()).toBe(true);
  expect(authService.errorMessage()).toBe('Authentication failed. Please try again.');
  expect(authService.isLoading()).toBe(false);
}

/** Verifies completion after failed session restoration. */
async function completesFailedInitialization(): Promise<void> {
  getSessionMock.mockRejectedValue(createAuthApiError('session_expired'));
  await authService.initialize();
  expect(getSessionMock).toHaveBeenCalledOnce();
  expect(authStateChangeMock).toHaveBeenCalledOnce();
  expect(authService.isInitialized()).toBe(true);
  expect(authService.isAuthenticated()).toBe(false);
  expect(authService.errorMessage()).toBe('Your session has expired. Please log in again.');
}

/**
 * Creates valid registration test data.
 * @param privacyAccepted - Privacy acceptance state assigned to the fixture.
 * @returns Complete registration credentials for service tests.
 */
function createSignUpCredentials(privacyAccepted = true): SignUpCredentials {
  return {
    fullName: 'Bastian Wollny',
    email: 'bastian@example.com',
    password: 'Secure123!',
    privacyAccepted,
  };
}

/**
 * Creates valid login test data.
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
 * @param code - Supabase authentication error code.
 * @returns Authentication error containing the provided code.
 */
function createAuthApiError(code: string): AuthApiError {
  return new AuthApiError('Test authentication error', 400, code);
}

/**
 * Creates a complete permanent Supabase user fixture.
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