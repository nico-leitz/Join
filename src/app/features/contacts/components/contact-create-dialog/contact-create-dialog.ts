import { Component, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CreateContact } from '../../../../core/models/contact.model';

/**
 * Component for handling the creation of a new contact via a modal dialog.
 * 
 * @remarks
 * This component manages a reactive form for contact creation, validates user input,
 * handles phone number sanitization, and emits events for submission or cancellation.
 * 
 * @public
 */
@Component({
  selector: 'app-contact-create-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-create-dialog.html',
  styleUrl: './contact-create-dialog.scss',
})
export class ContactCreateDialog {
  /** @internal Duration of the closing animation in milliseconds. */
  private readonly closeAnimationMs = 200;
  
  /** @internal Fallback value if no last name is provided. */
  private readonly fallbackLastName = 'Unknown';
  
  /** @internal Regex pattern for validating names. */
  private readonly namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß' -]+$/;
  
  /** @internal Regex pattern for validating phone numbers. */
  private readonly phonePattern = /^\+?[0-9 ]+$/;

  /** Event emitted when the creation process is cancelled. */
  cancelled = output<void>();

  /** Event emitted when the form is submitted with valid data. */
  submitted = output<CreateContact>();

  /** Signal tracking whether the dialog is in the closing state. */
  isClosing = signal(false);

  /** Reactive form group for contact input fields. */
  contactForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.validateName.bind(this)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(this.phonePattern)],
    }),
  });

  /**
   * Cancels the creation process and triggers the closing animation.
   * @public
   */
  cancel(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    window.setTimeout(() => this.cancelled.emit(), this.closeAnimationMs);
  }

  /**
   * Submits the form after sanitizing input and validating data.
   * @public
   */
  submitForm(): void {
    this.sanitizePhoneInput();
    this.contactForm.markAllAsTouched();
    this.contactForm.updateValueAndValidity();

    if (this.contactForm.invalid) {
      return;
    }

    this.submitted.emit(this.createContactPayload());
  }

  /**
   * Sanitizes the phone input based on predefined patterns.
   * @public
   */
  sanitizePhoneInput(): void {
    const phoneControl = this.contactForm.controls.phone;
    const sanitizedPhone = this.createSanitizedPhone(phoneControl.value);

    if (phoneControl.value !== sanitizedPhone) {
      phoneControl.setValue(sanitizedPhone, { emitEvent: false });
    }
  }

  /** @public Returns true if the full name field has validation errors. */
  hasNameError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.fullName);
  }

  /** @public Returns true if the email field has validation errors. */
  hasEmailError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.email);
  }

  /** @public Returns true if the phone field has validation errors. */
  hasPhoneError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.phone);
  }

  /** @public Returns the error message for the full name field. */
  getNameErrorMessage(): string {
    const control = this.contactForm.controls.fullName;

    if (!control.touched) return '';
    if (control.hasError('required')) return 'Name is required.';
    if (control.hasError('nameHasNumber')) return 'Name must not contain numbers.';
    if (control.hasError('invalidName')) return 'Use letters, spaces, hyphens or apostrophes only.';

    return '';
  }

  /** @public Returns the error message for the email field. */
  getEmailErrorMessage(): string {
    const control = this.contactForm.controls.email;

    if (!control.touched) return '';
    if (control.hasError('required')) return 'Email is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';

    return '';
  }

  /** @public Returns the error message for the phone field. */
  getPhoneErrorMessage(): string {
    const control = this.contactForm.controls.phone;

    if (!control.touched) return '';
    if (control.hasError('required')) return 'Phone is required.';
    if (control.hasError('pattern')) return 'Only numbers, spaces and one leading + are allowed.';

    return '';
  }

  /** @internal Custom validator for the name input. */
  private validateName(control: AbstractControl<string>): ValidationErrors | null {
    const fullName = control.value.trim();

    if (!fullName) return null;
    if (/\d/.test(fullName)) return { nameHasNumber: true };
    if (!this.namePattern.test(fullName)) return { invalidName: true };

    return null;
  }

  /** @internal Helper to check if a control is touched and invalid. */
  private hasTouchedError(control: AbstractControl): boolean {
    return control.touched && control.invalid;
  }

  /** @internal Maps form data to the CreateContact model payload. */
  private createContactPayload(): CreateContact {
    const fullNameParts = this.contactForm.controls.fullName.value.trim().split(/\s+/);
    const firstName = fullNameParts.shift() ?? '';

    return {
      firstName,
      lastName: fullNameParts.join(' ') || this.fallbackLastName,
      email: this.contactForm.controls.email.value.trim(),
      phone: this.contactForm.controls.phone.value.trim(),
    };
  }

  /** @internal Sanitizes the raw phone string. */
  private createSanitizedPhone(phone: string): string {
    const validCharactersOnly = phone.replace(/[^\d+\s]/g, '').replace(/\s+/g, ' ');
    return this.normalizePhonePlus(validCharactersOnly.trimStart());
  }

  /** @internal Ensures the phone number starts with a single '+' if needed. */
  private normalizePhonePlus(phone: string): string {
    if (phone.startsWith('+')) {
      return `+${phone.slice(1).replace(/\+/g, '')}`;
    }

    return phone.replace(/\+/g, '');
  }
}