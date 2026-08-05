import { TestBed } from '@angular/core/testing';
import type { Session, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseService } from '../supabase/supabase';
import { AuthRepository, AuthStateChangeCallback } from './auth.repository';

let repository: AuthRepository;
let signUpMock: ReturnType<typeof vi.fn>;
let signInMock: ReturnType<typeof vi.fn>;
let guestSignInMock: ReturnType<typeof vi.fn>;
let getSessionMock: ReturnType<typeof vi.fn>;
let authStateChangeMock: ReturnType<typeof vi.fn>;
let signOutMock: ReturnType<typeof vi.fn>;

describe('AuthRepository', registerAuthRepositoryTests);

/** Registers the AuthRepository test cases. */
function registerAuthRepositoryTests(): void {
  beforeEach(setUpAuthRepository);
  registerSuccessfulRequestTests();
  registerErrorForwardingTests();
}

/** Registers successful authentication request test cases. */
function registerSuccessfulRequestTests(): void {
  it('registers a user with normalized metadata', registersNormalizedUser);
  it('signs in with a trimmed email address', signsInWithTrimmedEmail);
  it('signs in an anonymous guest', signsInAnonymousGuest);
  it('returns the persisted session', returnsPersistedSession);
  it('subscribes to authentication state changes', subscribesToAuthChanges);
  it('signs out the active session', signsOutActiveSession);
}

/** Registers authentication error forwarding test cases. */
function registerErrorForwardingTests(): void {
  it('forwards authentication errors during sign-in', forwardsSignInError);
  it('rejects a successful response without a user', rejectsMissingUser);
  it('forwards errors while restoring a session', forwardsSessionError);
  it('forwards errors during sign-out', forwardsSignOutError);
}

/** Configures a fresh AuthRepository test instance. */
function setUpAuthRepository(): void {
  initializeAuthMocks();
  TestBed.configureTestingModule({
    providers: [AuthRepository, { provide: SupabaseService, useValue: createSupabaseMock() }],
  });
  repository = TestBed.inject(AuthRepository);
}

/** Initializes Supabase authentication mocks for one test. */
function initializeAuthMocks(): void {
  signUpMock = vi.fn();
  signInMock = vi.fn();
  guestSignInMock = vi.fn();
  getSessionMock = vi.fn();
  authStateChangeMock = vi.fn();
  signOutMock = vi.fn();
}

/**
 * Creates the Supabase service double used by dependency injection.
 * @returns Supabase service mock with authentication methods.
 */
function createSupabaseMock() {
  return {
    client: {
      auth: createAuthClientMock(),
    },
  };
}

/**
 * Creates the mocked Supabase authentication client.
 * @returns Authentication method mocks for the current test.
 */
function createAuthClientMock() {
  return {
    signUp: signUpMock,
    signInWithPassword: signInMock,
    signInAnonymously: guestSignInMock,
    getSession: getSessionMock,
    onAuthStateChange: authStateChangeMock,
    signOut: signOutMock,
  };
}

/** Verifies registration with normalized user metadata. */
async function registersNormalizedUser(): Promise<void> {
  const user = createUser();
  const session = createSession(user);
  mockSuccessfulRequest(signUpMock, user, session);
  const result = await repository.signUp(createRawSignUpCredentials());
  expect(signUpMock).toHaveBeenCalledWith(createNormalizedSignUpPayload());
  expect(result).toEqual({ user, session });
}

/** Verifies sign-in with a trimmed email address. */
async function signsInWithTrimmedEmail(): Promise<void> {
  const user = createUser();
  const session = createSession(user);
  mockSuccessfulRequest(signInMock, user, session);
  const result = await repository.signIn(createRawLoginCredentials());
  expect(signInMock).toHaveBeenCalledWith(createNormalizedLoginPayload());
  expect(result).toEqual({ user, session });
}

/** Verifies anonymous guest sign-in. */
async function signsInAnonymousGuest(): Promise<void> {
  const user = createGuestUser();
  const session = createSession(user);
  mockSuccessfulRequest(guestSignInMock, user, session);
  const result = await repository.signInAnonymously();
  expect(guestSignInMock).toHaveBeenCalledOnce();
  expect(result).toEqual({ user, session });
}

/** Verifies retrieval of a persisted session. */
async function returnsPersistedSession(): Promise<void> {
  const session = createSession(createUser());
  getSessionMock.mockResolvedValue({ data: { session }, error: null });
  const result = await repository.getSession();
  expect(getSessionMock).toHaveBeenCalledOnce();
  expect(result).toBe(session);
}

/** Verifies authentication state change subscriptions. */
function subscribesToAuthChanges(): void {
  const callback = vi.fn() as unknown as AuthStateChangeCallback;
  const subscription = { unsubscribe: vi.fn() };
  authStateChangeMock.mockReturnValue({ data: { subscription } });
  const result = repository.onAuthStateChange(callback);
  expect(authStateChangeMock).toHaveBeenCalledWith(callback);
  expect(result).toBe(subscription);
}

/** Verifies successful sign-out. */
async function signsOutActiveSession(): Promise<void> {
  signOutMock.mockResolvedValue({ error: null });
  await expect(repository.signOut()).resolves.toBeUndefined();
  expect(signOutMock).toHaveBeenCalledOnce();
}

/** Verifies forwarding of sign-in errors. */
async function forwardsSignInError(): Promise<void> {
  const error = new Error('Invalid login credentials');
  signInMock.mockResolvedValue({ data: { user: null, session: null }, error });
  await expect(repository.signIn(createInvalidLoginCredentials())).rejects.toBe(error);
}

/** Verifies rejection of a successful response without a user. */
async function rejectsMissingUser(): Promise<void> {
  signUpMock.mockResolvedValue({ data: { user: null, session: null }, error: null });
  await expect(repository.signUp(createSignUpCredentials())).rejects.toThrow(
    'Authentication response did not contain a user.',
  );
}

/** Verifies forwarding of session restoration errors. */
async function forwardsSessionError(): Promise<void> {
  const error = new Error('Session could not be restored');
  getSessionMock.mockResolvedValue({ data: { session: null }, error });
  await expect(repository.getSession()).rejects.toBe(error);
}

/** Verifies forwarding of sign-out errors. */
async function forwardsSignOutError(): Promise<void> {
  const error = new Error('Sign-out failed');
  signOutMock.mockResolvedValue({ error });
  await expect(repository.signOut()).rejects.toBe(error);
}

/**
 * Configures a successful Supabase authentication response.
 * @param mock - Authentication request mock receiving the response.
 * @param user - Authenticated Supabase user.
 * @param session - Session associated with the user.
 */
function mockSuccessfulRequest(mock: ReturnType<typeof vi.fn>, user: User, session: Session): void {
  mock.mockResolvedValue({ data: { user, session }, error: null });
}

/**
 * Creates raw registration credentials requiring normalization.
 * @returns Registration credentials containing surrounding whitespace.
 */
function createRawSignUpCredentials() {
  return {
    fullName: '  Bastian   Wollny  ',
    email: '  bastian@example.com  ',
    password: 'Secure123!',
  };
}

/**
 * Creates normalized Supabase registration arguments.
 * @returns Expected registration payload after normalization.
 */
function createNormalizedSignUpPayload() {
  return {
    email: 'bastian@example.com',
    password: 'Secure123!',
    options: {
      data: createNormalizedUserMetadata(),
    },
  };
}

/**
 * Creates normalized registration metadata.
 * @returns Expected user metadata after name normalization.
 */
function createNormalizedUserMetadata() {
  return {
    first_name: 'Bastian',
    last_name: 'Wollny',
    full_name: 'Bastian Wollny',
  };
}

/**
 * Creates raw login credentials requiring normalization.
 * @returns Login credentials containing surrounding whitespace.
 */
function createRawLoginCredentials() {
  return {
    email: '  bastian@example.com  ',
    password: 'Secure123!',
  };
}

/**
 * Creates normalized Supabase login arguments.
 * @returns Expected login payload after email normalization.
 */
function createNormalizedLoginPayload() {
  return {
    email: 'bastian@example.com',
    password: 'Secure123!',
  };
}

/**
 * Creates invalid login credentials for error forwarding tests.
 * @returns Login credentials rejected by the authentication provider.
 */
function createInvalidLoginCredentials() {
  return {
    email: 'bastian@example.com',
    password: 'WrongPassword',
  };
}

/**
 * Creates valid registration credentials for error tests.
 * @returns Complete registration credentials.
 */
function createSignUpCredentials() {
  return {
    fullName: 'Bastian Wollny',
    email: 'bastian@example.com',
    password: 'Secure123!',
  };
}

/**
 * Creates a complete permanent Supabase user fixture.
 * @returns Permanent user fixture.
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
 * @returns Anonymous user fixture.
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
 * @returns Session fixture for the provided user.
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