import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { ContactCreateDialog } from './contact-create-dialog';

/**
 * @description Unit tests for the ContactCreateDialog component.
 * This suite verifies reactive form validation, custom name regex checks,
 * phone number sanitization, and the delayed cancel animation workflow.
 */
describe('ContactCreateDialog Component', () => {
  let component: ContactCreateDialog;
  let fixture: ComponentFixture<ContactCreateDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactCreateDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactCreateDialog);
    component = fixture.componentInstance;

    vi.spyOn(component.cancelled, 'emit');
    vi.spyOn(component.submitted, 'emit');

    vi.useFakeTimers();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * @test Ensures the component creates successfully.
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Verifies that an empty required name field shows the correct error message.
   */
  it('should validate required full name', () => {
    const control = component.contactForm.controls.fullName;
    control.markAsTouched();
    control.setValue('');

    expect(component.hasNameError()).toBe(true);
    expect(component.getNameErrorMessage()).toBe('Name is required.');
  });

  /**
   * @test Verifies that a name containing numbers triggers the custom validation error.
   */
  it('should invalidate a name containing numbers', () => {
    const control = component.contactForm.controls.fullName;
    control.markAsTouched();
    control.setValue('John 123');

    expect(component.hasNameError()).toBe(true);
    expect(component.getNameErrorMessage()).toBe('Name must not contain numbers.');
  });

  /**
   * @test Verifies that a name with special characters (not letters, spaces, hyphens) is invalid.
   */
  it('should invalidate a name with forbidden special characters', () => {
    const control = component.contactForm.controls.fullName;
    control.markAsTouched();
    control.setValue('John Doe !@#');

    expect(component.hasNameError()).toBe(true);
    expect(component.getNameErrorMessage()).toBe('Use letters, spaces, hyphens or apostrophes only.');
  });

  /**
   * @test Verifies the required and format validation for the email field.
   */
  it('should validate email field correctly', () => {
    const control = component.contactForm.controls.email;
    control.markAsTouched();
    
    control.setValue('');
    expect(component.hasEmailError()).toBe(true);
    expect(component.getEmailErrorMessage()).toBe('Email is required.');

    control.setValue('invalid-email');
    expect(component.hasEmailError()).toBe(true);
    expect(component.getEmailErrorMessage()).toBe('Enter a valid email address.');
  });

  /**
   * @test Ensures that the cancel method sets the closing state and emits after a delay.
   */
  it('should trigger closing animation and emit cancelled event after 200ms', () => {
    component.cancel();

    expect(component.isClosing()).toBe(true);
    expect(component.cancelled.emit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  /**
   * @test Verifies that calling cancel multiple times does not restart the process.
   */
  it('should ignore subsequent cancel calls if already closing', () => {
    component.cancel();
    component.cancel(); 

    vi.advanceTimersByTime(200);

    expect(component.cancelled.emit).toHaveBeenCalledTimes(1);
  });

  /**
   * @test Ensures that a form with invalid data does not trigger the submitted event.
   */
  it('should not emit submitted event if form is invalid', () => {
    component.contactForm.controls.fullName.setValue('');
    
    component.submitForm();

    expect(component.contactForm.touched).toBe(true);
    expect(component.submitted.emit).not.toHaveBeenCalled();
  });

  /**
   * @test Tests the string manipulation that cleans up phone numbers.
   */
  it('should sanitize phone input by removing invalid characters and fixing plus signs', () => {
    const control = component.contactForm.controls.phone;

    control.setValue('+49 (123) 456-78a');
    component.sanitizePhoneInput();
    expect(control.value).toBe('+49 123 45678');

    control.setValue('++49 123 ++456');
    component.sanitizePhoneInput();
    expect(control.value).toBe('+49 123 456');

    // Angepasst: Kein Leerzeichen vor dem + am Ende, da trimStart() nur am Anfang greift
    control.setValue(' 123 456+');
    component.sanitizePhoneInput();
    expect(control.value).toBe('123 456');
  });

  /**
   * @test Verifies the correct splitting of a full name into first and last name.
   */
  it('should split full name into first and last name on submit', () => {
    component.contactForm.patchValue({
      fullName: 'Alice Marie Smith',
      email: 'alice@example.com',
      phone: '+123456789'
    });

    component.submitForm();

    expect(component.submitted.emit).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Marie Smith',
      email: 'alice@example.com',
      phone: '+123456789'
    });
  });

  /**
   * @test Ensures that a missing last name falls back to the default "Unknown" string.
   */
  it('should fallback to Unknown for last name if only one name is provided', () => {
    component.contactForm.patchValue({
      fullName: 'Bob',
      email: 'bob@example.com',
      phone: '+987654321'
    });

    component.submitForm();

    expect(component.submitted.emit).toHaveBeenCalledWith({
      firstName: 'Bob',
      lastName: 'Unknown',
      email: 'bob@example.com',
      phone: '+987654321'
    });
  });

  /**
   * @test Ensures that excessive spaces in the name are trimmed out properly during payload creation.
   */
  it('should trim and handle excessive whitespace in full name', () => {
    component.contactForm.patchValue({
      fullName: '  Charlie    Brown  ',
      email: 'charlie@test.com',
      phone: '123'
    });

    component.submitForm();

    expect(component.submitted.emit).toHaveBeenCalledWith({
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@test.com',
      phone: '123'
    });
  });
});