import { WritableSignal, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginCredentials } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { Login } from './login';

/** Mocked authentication service surface used by the login tests. */
interface AuthServiceMock {
  isLoading: WritableSignal<boolean>;
  errorMessage: WritableSignal<string>;
  clearError: ReturnType<typeof vi.fn>;
  signIn: ReturnType<typeof vi.fn>;
  signInAsGuest: ReturnType<typeof vi.fn>;
  queueSummaryGreeting: ReturnType<typeof vi.fn>;
}

let component: Login;
let fixture: ComponentFixture<Login>;
let router: Router;
let mockAuthService: AuthServiceMock;

/**
 * Creates the authentication service mock used by each test.
 * @returns Fresh authentication service mock.
 */
function createAuthServiceMock(): AuthServiceMock {
  return {
    isLoading: signal(false),
    errorMessage: signal(''),
    clearError: vi.fn(),
    signIn: vi.fn(),
    signInAsGuest: vi.fn(),
    queueSummaryGreeting: vi.fn(),
  };
}

/** Configures the login component testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [Login],
    providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
  }).compileComponents();
}

/** Creates a fresh login fixture and its dependency mocks. */
async function setupComponent(): Promise<void> {
  vi.useFakeTimers();
  Reflect.set(Login, 'hasShownSplash', false);
  mockAuthService = createAuthServiceMock();
  await configureTestBed();
  router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture = TestBed.createComponent(Login);
  component = fixture.componentInstance;
  fixture.detectChanges();
}

/** Restores timers and mocks after each login test. */
function cleanUpComponent(): void {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
}

/**
 * Returns the rendered login header logo.
 * @returns Header logo element used by the splash animation.
 */
function getHeaderLogo(): HTMLImageElement {
  return fixture.nativeElement.querySelector('.login-page__logo img') as HTMLImageElement;
}

/**
 * Returns the rendered splash element.
 * @returns Splash element whose animation class is inspected.
 */
function getSplashElement(): HTMLElement {
  return fixture.nativeElement.querySelector('.login-splash') as HTMLElement;
}

/** Mocks the header logo bounds used as splash destination. */
function mockHeaderLogoBounds(): void {
  vi.spyOn(getHeaderLogo(), 'getBoundingClientRect').mockReturnValue({
    top: 24,
    left: 16,
    width: 64,
  } as DOMRect);
}

/**
 * Returns the email form control.
 * @returns Email control used by validation tests.
 */
function getEmailControl(): FormControl<string> {
  return component.loginForm.controls.email;
}

/**
 * Sets the credentials used by a login attempt.
 * @param email - Email entered into the login form.
 * @param password - Password entered into the login form.
 */
function setCredentials(email: string, password: string): void {
  component.loginForm.patchValue({ email, password });
}

/** Verifies component creation and constructor error cleanup. */
function shouldCreateAndClearErrors(): void {
  expect(component).toBeTruthy();
  expect(mockAuthService.clearError).toHaveBeenCalled();
}

/** Verifies that the rendered logo defines the splash destination. */
function shouldUseHeaderLogoAsSplashTarget(): void {
  mockHeaderLogoBounds();
  component.onHeaderLogoLoad();
  expect(component.splashTarget()).toEqual({
    top: '24px',
    left: '16px',
    width: '64px',
  });
}

/** Verifies the separate initial, moving, and completed splash states. */
function shouldAnimateSplashInSeparateStates(): void {
  expect(component.splashAnimating()).toBe(false);
  component.onHeaderLogoLoad();
  vi.advanceTimersByTime(80);
  fixture.detectChanges();
  expect(component.splashAnimating()).toBe(true);
  expect(getSplashElement().classList.contains('login-splash--animating')).toBe(true);
  vi.advanceTimersByTime(2400);
  expect(component.showSplash()).toBe(false);
}

/** Verifies required validation for an empty email. */
function shouldInvalidateEmptyEmail(): void {
  const control = getEmailControl();
  control.markAsTouched();
  control.setValue('');
  expect(control.invalid).toBe(true);
  expect(control.hasError('required')).toBe(true);
  expect(component.isControlInvalid('email')).toBe(true);
}

/** Verifies strict email validation for malformed input. */
function shouldInvalidateMalformedEmail(): void {
  const control = getEmailControl();
  control.markAsTouched();
  control.setValue('invalid-email-format');
  expect(control.invalid).toBe(true);
  expect(control.hasError('strictEmail')).toBe(true);
  expect(component.isControlInvalid('email')).toBe(true);
}

/** Verifies rejection of email domains without a top-level domain. */
function shouldInvalidateEmailWithoutTopLevelDomain(): void {
  const control = getEmailControl();
  control.markAsTouched();
  control.setValue('tester@provider');
  expect(control.invalid).toBe(true);
  expect(control.hasError('strictEmail')).toBe(true);
  expect(component.isControlInvalid('email')).toBe(true);
}

/** Verifies acceptance of a complete provider domain. */
function shouldAcceptCompleteEmailDomain(): void {
  const control = getEmailControl();
  control.setValue('tester@provider.de');
  expect(control.valid).toBe(true);
  expect(control.hasError('strictEmail')).toBe(false);
}

/** Verifies required validation for an empty password. */
function shouldInvalidateEmptyPassword(): void {
  const control = component.loginForm.controls.password;
  control.markAsTouched();
  control.setValue('');
  expect(control.invalid).toBe(true);
  expect(control.hasError('required')).toBe(true);
  expect(component.isControlInvalid('password')).toBe(true);
}

/** Verifies that invalid form submission does not call the service. */
async function shouldRejectInvalidSubmission(): Promise<void> {
  setCredentials('', '');
  await component.onSubmit();
  expect(component.submitted()).toBe(true);
  expect(component.loginForm.touched).toBe(true);
  expect(mockAuthService.signIn).not.toHaveBeenCalled();
}

/** Verifies normalized credentials and navigation after successful login. */
async function shouldHandleSuccessfulUserLogin(): Promise<void> {
  mockAuthService.signIn.mockResolvedValue(true);
  setCredentials('TestUser@Example.com', 'SecurePassword123');
  await component.onSubmit();
  expect(component.submitted()).toBe(true);
  expect(mockAuthService.signIn).toHaveBeenCalledWith({
    email: 'testuser@example.com',
    password: 'SecurePassword123',
  } satisfies LoginCredentials);
  expect(mockAuthService.queueSummaryGreeting).toHaveBeenCalled();
  expect(router.navigate).toHaveBeenCalledWith(['/summary']);
}

/** Verifies that a failed user login does not navigate. */
async function shouldNotNavigateAfterFailedUserLogin(): Promise<void> {
  mockAuthService.signIn.mockResolvedValue(false);
  setCredentials('test@example.com', 'wrongpassword');
  await component.onSubmit();
  expect(mockAuthService.signIn).toHaveBeenCalled();
  expect(mockAuthService.queueSummaryGreeting).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
}

/** Verifies guest authentication and navigation after success. */
async function shouldHandleSuccessfulGuestLogin(): Promise<void> {
  mockAuthService.signInAsGuest.mockResolvedValue(true);
  await component.onGuestLogin();
  expect(mockAuthService.signInAsGuest).toHaveBeenCalled();
  expect(mockAuthService.queueSummaryGreeting).toHaveBeenCalled();
  expect(router.navigate).toHaveBeenCalledWith(['/summary']);
}

/** Verifies that a failed guest login does not navigate. */
async function shouldNotNavigateAfterFailedGuestLogin(): Promise<void> {
  mockAuthService.signInAsGuest.mockResolvedValue(false);
  await component.onGuestLogin();
  expect(mockAuthService.signInAsGuest).toHaveBeenCalled();
  expect(mockAuthService.queueSummaryGreeting).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
}

/** Verifies cleanup of a backend error after form changes. */
function shouldClearBackendErrorOnFormChange(): void {
  mockAuthService.errorMessage.set('Invalid credentials');
  component.onFormChange();
  expect(mockAuthService.clearError).toHaveBeenCalled();
}

/** Verifies that form changes avoid unnecessary error cleanup. */
function shouldPreserveEmptyErrorState(): void {
  mockAuthService.clearError.mockClear();
  mockAuthService.errorMessage.set('');
  component.onFormChange();
  expect(mockAuthService.clearError).not.toHaveBeenCalled();
}

/** Registers component and splash test cases. */
function registerComponentTests(): void {
  it(
    'should create the component and clear auth errors in constructor',
    shouldCreateAndClearErrors,
  );
  it('should use the rendered header logo as splash target', shouldUseHeaderLogoAsSplashTarget);
  it(
    'should start and finish the splash animation with separate states',
    shouldAnimateSplashInSeparateStates,
  );
}

/** Registers form validation test cases. */
function registerValidationTests(): void {
  it('should invalidate an empty email field', shouldInvalidateEmptyEmail);
  it('should invalidate a malformed email address', shouldInvalidateMalformedEmail);
  it(
    'should invalidate an email without a top-level domain',
    shouldInvalidateEmailWithoutTopLevelDomain,
  );
  it('should accept an email with a complete provider domain', shouldAcceptCompleteEmailDomain);
  it('should invalidate an empty password field', shouldInvalidateEmptyPassword);
}

/** Registers user and guest authentication test cases. */
function registerAuthenticationTests(): void {
  it('should not call signIn when submitting an invalid form', shouldRejectInvalidSubmission);
  it(
    'should normalize credentials, call signIn, and navigate to summary on successful login',
    shouldHandleSuccessfulUserLogin,
  );
  it('should not navigate to summary if user login fails', shouldNotNavigateAfterFailedUserLogin);
  it(
    'should call signInAsGuest and navigate to summary on success',
    shouldHandleSuccessfulGuestLogin,
  );
  it('should not navigate to summary if guest login fails', shouldNotNavigateAfterFailedGuestLogin);
}

/** Registers backend error cleanup test cases. */
function registerErrorTests(): void {
  it(
    'should clear backend auth errors when form input changes',
    shouldClearBackendErrorOnFormChange,
  );
  it(
    'should not call clearError on form change if no error message exists',
    shouldPreserveEmptyErrorState,
  );
}

/** Registers the login component test cases. */
function registerTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerComponentTests();
  registerValidationTests();
  registerAuthenticationTests();
  registerErrorTests();
}

describe('Login Component', registerTests);