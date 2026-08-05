import { WritableSignal, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignUpCredentials } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { Signup } from './signup';

/** Mocked authentication service surface used by the signup tests. */
interface AuthServiceMock {
  isLoading: WritableSignal<boolean>;
  errorMessage: WritableSignal<string>;
  clearError: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
}

let component: Signup;
let fixture: ComponentFixture<Signup>;
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
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
}

/** Configures the signup component testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [Signup],
    providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
  }).compileComponents();
}

/** Creates a fresh signup fixture and its dependency mocks. */
async function setupComponent(): Promise<void> {
  mockAuthService = createAuthServiceMock();
  await configureTestBed();
  router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture = TestBed.createComponent(Signup);
  component = fixture.componentInstance;
  fixture.detectChanges();
}

/** Restores timers and mocks after each signup test. */
function cleanUpComponent(): void {
  vi.useRealTimers();
  vi.clearAllMocks();
}

/**
 * Returns the full name form control.
 * @returns Full name control used by validation tests.
 */
function getFullNameControl(): FormControl<string> {
  return component.signupForm.controls.fullName;
}

/**
 * Returns the email form control.
 * @returns Email control used by validation tests.
 */
function getEmailControl(): FormControl<string> {
  return component.signupForm.controls.email;
}

/**
 * Returns the password form control.
 * @returns Password control used by validation tests.
 */
function getPasswordControl(): FormControl<string> {
  return component.signupForm.controls.password;
}

/**
 * Sets valid values for a signup attempt.
 * @param fullName - Full name entered into the signup form.
 * @param email - Email entered into the signup form.
 */
function setValidSignupValues(fullName = 'John Doe', email = 'john@example.com'): void {
  component.signupForm.patchValue({
    fullName,
    email,
    password: 'Password123',
    confirmPassword: 'Password123',
    privacyAccepted: true,
  });
}

/** Verifies component creation and constructor error cleanup. */
function shouldCreateAndClearErrors(): void {
  expect(component).toBeTruthy();
  expect(mockAuthService.clearError).toHaveBeenCalled();
}

/** Verifies required validation for an empty full name. */
function shouldInvalidateEmptyFullName(): void {
  const control = getFullNameControl();
  control.markAsTouched();
  control.setValue('');
  expect(control.invalid).toBe(true);
  expect(control.hasError('required')).toBe(true);
  expect(component.isControlInvalid('fullName')).toBe(true);
}

/** Verifies required validation for a whitespace-only full name. */
function shouldInvalidateWhitespaceFullName(): void {
  const control = getFullNameControl();
  control.markAsTouched();
  control.setValue('   ');
  expect(control.invalid).toBe(true);
  expect(control.hasError('required')).toBe(true);
  expect(component.isControlInvalid('fullName')).toBe(true);
}

/** Verifies the minimum alphabetic character count for names. */
function shouldInvalidateShortFullName(): void {
  const control = getFullNameControl();
  control.setValue('Amy Li');
  expect(control.hasError('minLetters')).toBe(true);
}

/** Verifies rejection of unsupported name characters. */
function shouldInvalidateUnsupportedNameCharacters(): void {
  const control = getFullNameControl();
  control.setValue('John Doe2');
  expect(control.hasError('invalidNameCharacters')).toBe(true);
}

/** Verifies support for international names and separators. */
function shouldAcceptInternationalName(): void {
  const control = getFullNameControl();
  control.setValue("Anne-Marie O'Neill");
  expect(control.valid).toBe(true);
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

/**
 * Verifies rejection of an invalid provider or domain ending.
 * @param email - Invalid email address under test.
 */
function shouldRejectInvalidEmailDomain(email: string): void {
  const control = getEmailControl();
  control.setValue(email);
  expect(control.hasError('strictEmail')).toBe(true);
}

/** Verifies acceptance of a structurally valid email address. */
function shouldAcceptStructurallyValidEmail(): void {
  const control = getEmailControl();
  control.setValue('user.name+tag@sub.provider.co.uk');
  expect(control.valid).toBe(true);
}

/** Verifies the minimum password length. */
function shouldRequireMinimumPasswordLength(): void {
  const control = getPasswordControl();
  control.setValue('Pass123');
  expect(control.hasError('minlength')).toBe(true);
}

/** Verifies the required uppercase password character. */
function shouldRequireUppercasePasswordLetter(): void {
  const control = getPasswordControl();
  control.setValue('password123');
  expect(control.hasError('missingUppercase')).toBe(true);
}

/** Verifies the required numeric password character. */
function shouldRequirePasswordNumber(): void {
  const control = getPasswordControl();
  control.setValue('PasswordOnly');
  expect(control.hasError('missingNumber')).toBe(true);
}

/** Verifies acceptance of a password satisfying every rule. */
function shouldAcceptStrongPassword(): void {
  const control = getPasswordControl();
  control.setValue('Password123');
  expect(control.valid).toBe(true);
}

/** Verifies password mismatch validation. */
function shouldInvalidateMismatchedPasswords(): void {
  component.signupForm.patchValue({
    password: 'SecurePassword123',
    confirmPassword: 'DifferentPassword456',
  });
  component.signupForm.controls.confirmPassword.markAsTouched();
  expect(component.signupForm.hasError('passwordMismatch')).toBe(true);
  expect(component.hasPasswordMismatch()).toBe(true);
}

/** Verifies matching password validation. */
function shouldAcceptMatchingPasswords(): void {
  component.signupForm.patchValue({
    password: 'MatchingPassword123',
    confirmPassword: 'MatchingPassword123',
  });
  expect(component.signupForm.hasError('passwordMismatch')).toBe(false);
  expect(component.hasPasswordMismatch()).toBe(false);
}

/** Verifies that privacy policy acceptance is required. */
function shouldRequirePrivacyAcceptance(): void {
  const control = component.signupForm.controls.privacyAccepted;
  control.markAsTouched();
  control.setValue(false);
  expect(control.invalid).toBe(true);
  expect(control.hasError('required')).toBe(true);
  expect(component.isControlInvalid('privacyAccepted')).toBe(true);
}

/** Verifies that invalid form submission does not call the service. */
async function shouldRejectInvalidSubmission(): Promise<void> {
  component.signupForm.patchValue({ fullName: 'John Doe', email: 'john@example.com' });
  await component.onSubmit();
  expect(component.submitted()).toBe(true);
  expect(component.signupForm.touched).toBe(true);
  expect(mockAuthService.signUp).not.toHaveBeenCalled();
}

/** Prepares service results and form values for successful signup. */
function prepareSuccessfulSignup(): void {
  vi.useFakeTimers();
  mockAuthService.signUp.mockResolvedValue(true);
  mockAuthService.signOut.mockResolvedValue(true);
  setValidSignupValues('  Jane Doe  ', 'Jane.Doe@Example.com');
  component.signupForm.controls.password.setValue('SecurePassword123');
  component.signupForm.controls.confirmPassword.setValue('SecurePassword123');
}

/** Verifies signup normalization and feedback before delayed navigation. */
function expectSuccessfulSignupStart(): void {
  expect(mockAuthService.signUp).toHaveBeenCalledWith({
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    password: 'SecurePassword123',
    privacyAccepted: true,
  } satisfies SignUpCredentials);
  expect(mockAuthService.signOut).toHaveBeenCalledOnce();
  expect(component.showSuccessMessage()).toBe(true);
  expect(router.navigate).not.toHaveBeenCalled();
}

/**
 * Completes and verifies delayed login navigation.
 * @param submitPromise - Pending signup submission.
 */
async function finishSuccessfulSignup(submitPromise: Promise<void>): Promise<void> {
  await vi.advanceTimersByTimeAsync(2600);
  await submitPromise;
  expect(component.showSuccessMessage()).toBe(false);
  expect(router.navigate).toHaveBeenCalledWith(['/login']);
}

/** Verifies normalized signup, success feedback, and login navigation. */
async function shouldHandleSuccessfulSignup(): Promise<void> {
  prepareSuccessfulSignup();
  const submitPromise = component.onSubmit();
  await Promise.resolve();
  await Promise.resolve();
  expectSuccessfulSignupStart();
  await finishSuccessfulSignup(submitPromise);
}

/** Verifies that failed signup does not sign out or navigate. */
async function shouldNotNavigateAfterFailedSignup(): Promise<void> {
  mockAuthService.signUp.mockResolvedValue(false);
  setValidSignupValues();
  await component.onSubmit();
  expect(mockAuthService.signUp).toHaveBeenCalled();
  expect(mockAuthService.signOut).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
}

/** Verifies that failed sign-out blocks feedback and navigation. */
async function shouldNotNavigateAfterFailedSignOut(): Promise<void> {
  mockAuthService.signUp.mockResolvedValue(true);
  mockAuthService.signOut.mockResolvedValue(false);
  setValidSignupValues();
  await component.onSubmit();
  expect(component.showSuccessMessage()).toBe(false);
  expect(router.navigate).not.toHaveBeenCalled();
}

/** Verifies cleanup of a backend error after form changes. */
function shouldClearBackendErrorOnFormChange(): void {
  mockAuthService.errorMessage.set('Email already exists');
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

/** Registers component and name validation test cases. */
function registerComponentAndNameTests(): void {
  it(
    'should create the component and clear auth errors in constructor',
    shouldCreateAndClearErrors,
  );
  it('should invalidate an empty full name field', shouldInvalidateEmptyFullName);
  it(
    'should invalidate a full name field containing only whitespace',
    shouldInvalidateWhitespaceFullName,
  );
  it('should invalidate a name containing fewer than six letters', shouldInvalidateShortFullName);
  it('should invalidate unsupported name characters', shouldInvalidateUnsupportedNameCharacters);
  it('should accept a valid international name with separators', shouldAcceptInternationalName);
}

/** Registers email validation test cases. */
function registerEmailTests(): void {
  it('should invalidate a malformed email address', shouldInvalidateMalformedEmail);
  it.each([
    'user@provider',
    'user@provider.c',
    'user@-provider.com',
    'user@provider-.com',
    'user@provider..com',
  ])('should reject an invalid provider or domain ending: %s', shouldRejectInvalidEmailDomain);
  it('should accept a structurally valid email address', shouldAcceptStructurallyValidEmail);
}

/** Registers password and privacy validation test cases. */
function registerPasswordTests(): void {
  it('should require at least eight password characters', shouldRequireMinimumPasswordLength);
  it('should require an uppercase password letter', shouldRequireUppercasePasswordLetter);
  it('should require a number in the password', shouldRequirePasswordNumber);
  it('should accept a password satisfying all strength rules', shouldAcceptStrongPassword);
  it('should invalidate the form if passwords do not match', shouldInvalidateMismatchedPasswords);
  it('should validate successfully when passwords match', shouldAcceptMatchingPasswords);
  it('should invalidate if privacy policy is not accepted', shouldRequirePrivacyAcceptance);
}

/** Registers signup submission test cases. */
function registerSubmissionTests(): void {
  it('should not call signUp when submitting an invalid form', shouldRejectInvalidSubmission);
  it(
    'should show success feedback and navigate to login after signup',
    shouldHandleSuccessfulSignup,
  );
  it('should not navigate if signUp fails', shouldNotNavigateAfterFailedSignup);
  it(
    'should not show success feedback or navigate if sign-out fails',
    shouldNotNavigateAfterFailedSignOut,
  );
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

/** Registers the signup component test cases. */
function registerTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerComponentAndNameTests();
  registerEmailTests();
  registerPasswordTests();
  registerSubmissionTests();
  registerErrorTests();
}

describe('Signup Component', registerTests);