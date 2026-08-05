import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

let initializeMock: ReturnType<typeof vi.fn>;
let isAuthenticatedMock: ReturnType<typeof vi.fn>;
let router: Router;

describe('authGuard', registerAuthGuardTests);

/** Registers the authentication guard tests. */
function registerAuthGuardTests(): void {
  beforeEach(setupAuthGuard);
  afterEach(resetAuthGuardTestBed);
  it('allows a registered user with an active session', testRegisteredUser);
  it('allows an anonymous guest with an active session', testAnonymousGuest);
  it('redirects a visitor without a session to login', testVisitorRedirect);
  it('waits for session restoration before checking access', testSessionRestore);
  it('redirects to login when initialization fails', testInitializationFailure);
}

/** Prepares the guard dependencies for one test. */
function setupAuthGuard(): void {
  initializeMock = vi.fn().mockResolvedValue(undefined);
  isAuthenticatedMock = vi.fn().mockReturnValue(false);
  configureAuthServiceMock();
  router = TestBed.inject(Router);
}

/** Configures the mocked authentication service. */
function configureAuthServiceMock(): void {
  const authServiceMock = {
    initialize: initializeMock,
    isAuthenticated: isAuthenticatedMock,
  };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
  });
}

/** Resets Angular's test dependency injection context. */
function resetAuthGuardTestBed(): void {
  TestBed.resetTestingModule();
}

/** Verifies access for a registered user with an active session. */
async function testRegisteredUser(): Promise<void> {
  isAuthenticatedMock.mockReturnValue(true);
  const result = await runAuthGuard();

  expect(result).toBe(true);
  expect(initializeMock).toHaveBeenCalledOnce();
}

/** Verifies access for an anonymous guest with an active session. */
async function testAnonymousGuest(): Promise<void> {
  isAuthenticatedMock.mockReturnValue(true);
  const result = await runAuthGuard();

  expect(result).toBe(true);
  expect(isAuthenticatedMock).toHaveBeenCalledOnce();
}

/** Verifies login redirection for a visitor without a session. */
async function testVisitorRedirect(): Promise<void> {
  const result = await runAuthGuard();

  expect(result).toBeInstanceOf(UrlTree);
  expect(router.serializeUrl(result as UrlTree)).toBe('/login');
}

/** Verifies that access checks wait for session restoration. */
async function testSessionRestore(): Promise<void> {
  let finishInitialization = (): void => undefined;
  const pendingInitialization = new Promise<void>((resolve) => {
    finishInitialization = resolve;
  });
  initializeMock.mockReturnValue(pendingInitialization);
  isAuthenticatedMock.mockReturnValue(true);
  const guardResult = runAuthGuard();

  expect(isAuthenticatedMock).not.toHaveBeenCalled();
  finishInitialization();
  expect(await guardResult).toBe(true);
}

/** Verifies login redirection after failed session restoration. */
async function testInitializationFailure(): Promise<void> {
  initializeMock.mockRejectedValue(new Error('Session restore failed'));
  const result = await runAuthGuard();

  expect(result).toBeInstanceOf(UrlTree);
  expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  expect(isAuthenticatedMock).not.toHaveBeenCalled();
}

/**
 * Runs the functional guard inside Angular's dependency injection context.
 * @returns Guard decision or login redirect.
 */
function runAuthGuard(): Promise<boolean | UrlTree> {
  return TestBed.runInInjectionContext(() => {
    return authGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/board' } as RouterStateSnapshot,
    ) as Promise<boolean | UrlTree>;
  });
}