import { TestBed } from '@angular/core/testing';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let signUpMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    signUpMock = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: { signUp: signUpMock },
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
    const result = await authService.signUp({
      fullName: 'Bastian Wollny',
      email: 'bastian@example.com',
      password: 'Secure123!',
      privacyAccepted: false,
    });

    expect(result).toBeNull();
    expect(authService.errorMessage()).toBe(
      'Please accept the Privacy Policy.'
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('clears an existing authentication error', async () => {
    await authService.signUp({
      fullName: 'Bastian Wollny',
      email: 'bastian@example.com',
      password: 'Secure123!',
      privacyAccepted: false,
    });

    authService.clearError();

    expect(authService.errorMessage()).toBeNull();
  });
});