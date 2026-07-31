import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let initializeMock: ReturnType<typeof vi.fn>;
  let isAuthenticatedMock: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(() => {
    initializeMock = vi.fn().mockResolvedValue(undefined);
    isAuthenticatedMock = vi.fn().mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            initialize: initializeMock,
            isAuthenticated: isAuthenticatedMock,
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('allows a registered user with an active session', async () => {
    isAuthenticatedMock.mockReturnValue(true);

    const result = await runAuthGuard();

    expect(result).toBe(true);
    expect(initializeMock).toHaveBeenCalledOnce();
  });

  it('allows an anonymous guest with an active session', async () => {
    isAuthenticatedMock.mockReturnValue(true);

    const result = await runAuthGuard();

    expect(result).toBe(true);
    expect(isAuthenticatedMock).toHaveBeenCalledOnce();
  });

  it('redirects a visitor without a session to login', async () => {
    const result = await runAuthGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('waits for session restoration before checking access', async () => {
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
  });

  it('redirects to login when initialization fails', async () => {
    initializeMock.mockRejectedValue(new Error('Session restore failed'));

    const result = await runAuthGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    expect(isAuthenticatedMock).not.toHaveBeenCalled();
  });
});

/**
 * Runs the functional guard inside Angular's dependency injection context.
 */
function runAuthGuard(): Promise<boolean | UrlTree> {
  return TestBed.runInInjectionContext(() => {
    return authGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/board' } as RouterStateSnapshot
    ) as Promise<boolean | UrlTree>;
  });
}