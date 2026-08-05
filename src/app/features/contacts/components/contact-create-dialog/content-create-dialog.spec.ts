import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactCreateDialog } from './contact-create-dialog';

let component: ContactCreateDialog;
let fixture: ComponentFixture<ContactCreateDialog>;

/** Configures the standalone contact-create-dialog testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [ContactCreateDialog],
  }).compileComponents();
}

/** Creates a rendered contact-create-dialog fixture with output spies. */
async function setupComponent(): Promise<void> {
  await configureTestBed();
  fixture = TestBed.createComponent(ContactCreateDialog);
  component = fixture.componentInstance;
  vi.spyOn(component.cancelled, 'emit');
  vi.spyOn(component.submitted, 'emit');
  vi.useFakeTimers();
  fixture.detectChanges();
}

/** Restores real timers and clears spies after each test. */
function cleanUpComponent(): void {
  vi.useRealTimers();
  vi.restoreAllMocks();
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies the required full-name validation message. */
function shouldValidateRequiredName(): void {
  const control = component.contactForm.controls.fullName;
  control.markAsTouched();
  control.setValue('');
  expect(component.hasNameError()).toBe(true);
  expect(component.getNameErrorMessage()).toBe('Name is required.');
}

/** Verifies the numeric full-name validation message. */
function shouldRejectNumericName(): void {
  const control = component.contactForm.controls.fullName;
  control.markAsTouched();
  control.setValue('John 123');
  expect(component.hasNameError()).toBe(true);
  expect(component.getNameErrorMessage()).toBe('Name must not contain numbers.');
}

/** Verifies the unsupported-character full-name validation message. */
function shouldRejectSpecialCharacterName(): void {
  const control = component.contactForm.controls.fullName;
  control.markAsTouched();
  control.setValue('John Doe !@#');
  expect(component.hasNameError()).toBe(true);
  expect(component.getNameErrorMessage()).toBe('Use letters, spaces, hyphens or apostrophes only.');
}

/** Verifies required and format validation for the email field. */
function shouldValidateEmail(): void {
  const control = component.contactForm.controls.email;
  control.markAsTouched();
  control.setValue('');
  expect(component.hasEmailError()).toBe(true);
  expect(component.getEmailErrorMessage()).toBe('Email is required.');
  control.setValue('invalid-email');
  expect(component.hasEmailError()).toBe(true);
  expect(component.getEmailErrorMessage()).toBe('Enter a valid email address.');
}

/** Verifies delayed cancellation after the closing animation. */
function shouldCancelAfterAnimation(): void {
  component.cancel();
  expect(component.isClosing()).toBe(true);
  expect(component.cancelled.emit).not.toHaveBeenCalled();
  vi.advanceTimersByTime(200);
  expect(component.cancelled.emit).toHaveBeenCalled();
}

/** Verifies that repeated cancellation emits only once. */
function shouldIgnoreRepeatedCancel(): void {
  component.cancel();
  component.cancel();
  vi.advanceTimersByTime(200);
  expect(component.cancelled.emit).toHaveBeenCalledTimes(1);
}

/** Verifies that invalid form data cannot be submitted. */
function shouldRejectInvalidForm(): void {
  component.contactForm.controls.fullName.setValue('');
  component.submitForm();
  expect(component.contactForm.touched).toBe(true);
  expect(component.submitted.emit).not.toHaveBeenCalled();
}

/** Verifies removal of phone characters and misplaced plus signs. */
function shouldSanitizePhoneInput(): void {
  const control = component.contactForm.controls.phone;
  control.setValue('+49 (123) 456-78a');
  component.sanitizePhoneInput();
  expect(control.value).toBe('+49 123 45678');
  control.setValue('++49 123 ++456');
  component.sanitizePhoneInput();
  expect(control.value).toBe('+49 123 456');
  control.setValue(' 123 456+');
  component.sanitizePhoneInput();
  expect(control.value).toBe('123 456');
}

/** Verifies full-name splitting in the submitted contact payload. */
function shouldSplitFullName(): void {
  component.contactForm.patchValue({
    fullName: 'Alice Marie Smith',
    email: 'alice@example.com',
    phone: '+123456789',
  });
  component.submitForm();
  expect(component.submitted.emit).toHaveBeenCalledWith({
    firstName: 'Alice',
    lastName: 'Marie Smith',
    email: 'alice@example.com',
    phone: '+123456789',
  });
}

/** Verifies the fallback last name for a single supplied name. */
function shouldUseFallbackLastName(): void {
  component.contactForm.patchValue({
    fullName: 'Bob',
    email: 'bob@example.com',
    phone: '+987654321',
  });
  component.submitForm();
  expect(component.submitted.emit).toHaveBeenCalledWith({
    firstName: 'Bob',
    lastName: 'Unknown',
    email: 'bob@example.com',
    phone: '+987654321',
  });
}

/** Verifies whitespace normalization in the submitted contact payload. */
function shouldNormalizeFullNameWhitespace(): void {
  component.contactForm.patchValue({
    fullName: '  Charlie    Brown  ',
    email: 'charlie@test.com',
    phone: '123',
  });
  component.submitForm();
  expect(component.submitted.emit).toHaveBeenCalledWith({
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie@test.com',
    phone: '123',
  });
}

/** Registers creation and validation tests. */
// prettier-ignore
function registerValidationTests(): void {
  it('should create the component', shouldCreateComponent);
  it('should validate required full name', shouldValidateRequiredName);
  it('should invalidate a name containing numbers', shouldRejectNumericName);
  it('should invalidate a name with forbidden special characters', shouldRejectSpecialCharacterName);
  it('should validate email field correctly', shouldValidateEmail);
}

/** Registers closing and form-submission tests. */
// prettier-ignore
function registerWorkflowTests(): void {
  it('should trigger closing animation and emit cancelled event after 200ms', shouldCancelAfterAnimation);
  it('should ignore subsequent cancel calls if already closing', shouldIgnoreRepeatedCancel);
  it('should not emit submitted event if form is invalid', shouldRejectInvalidForm);
  it('should sanitize phone input by removing invalid characters and fixing plus signs', shouldSanitizePhoneInput);
}

/** Registers submitted contact-payload tests. */
// prettier-ignore
function registerPayloadTests(): void {
  it('should split full name into first and last name on submit', shouldSplitFullName);
  it('should fallback to Unknown for last name if only one name is provided', shouldUseFallbackLastName);
  it('should trim and handle excessive whitespace in full name', shouldNormalizeFullNameWhitespace);
}

/** Registers the complete contact-create-dialog test suite. */
function registerContactCreateDialogTests(): void {
  beforeEach(setupComponent);
  afterEach(cleanUpComponent);
  registerValidationTests();
  registerWorkflowTests();
  registerPayloadTests();
}

describe('ContactCreateDialog Component', registerContactCreateDialogTests);