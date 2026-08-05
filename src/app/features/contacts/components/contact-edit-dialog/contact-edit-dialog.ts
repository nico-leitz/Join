import { Component, OnInit, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Contact, UpdateContact } from '../../../../core/models/contact.model';

/**
 * Collects and validates changes to an existing contact.
 *
 * Initializes the form from the required contact input, sanitizes phone data
 * and emits update, deletion or cancellation requests.
 */
@Component({
  selector: 'app-contact-edit-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-edit-dialog.html',
  styleUrl: './contact-edit-dialog.scss',
})
export class ContactEditDialog implements OnInit {
  /** Duration of the dialog closing animation in milliseconds. */
  private readonly closeAnimationMs = 200;

  /** Last name used when the user enters only one name. */
  private readonly fallbackLastName = 'Unknown';

  /** Pattern allowing supported letters and name separators. */
  private readonly namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  /** Pattern allowing digits, spaces and one optional leading plus sign. */
  private readonly phonePattern = /^\+?[0-9 ]+$/;

  /** Contact whose values should be edited. */
  readonly contact = input.required<Contact>();

  /** Emits after the user cancels and the closing animation finishes. */
  readonly cancelled = output<void>();

  /** Emits a normalized update payload after successful validation. */
  readonly submitted = output<UpdateContact>();

  /** Emits the identifier of the contact requested for deletion. */
  readonly deleted = output<string>();

  /** Indicates whether the dialog is currently closing. */
  readonly isClosing = signal(false);

  /** Reactive form containing the editable contact fields. */
  readonly contactForm = new FormGroup({
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
   * Initializes the form with the current contact values.
   */
  ngOnInit(): void {
    this.setInitialFormValues();
  }

  /**
   * Starts the closing animation and emits the cancellation request once.
   */
  cancel(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);

    window.setTimeout(() => {
      this.cancelled.emit();
    }, this.closeAnimationMs);
  }

  /**
   * Sanitizes and validates the form before emitting an update payload.
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
   * Requests deletion of the contact currently being edited.
   */
  deleteContact(): void {
    this.deleted.emit(this.contact().id);
  }

  /**
   * Removes unsupported characters and normalizes plus signs in the phone field.
   */
  sanitizePhoneInput(): void {
    const phoneControl = this.contactForm.controls.phone;
    const sanitizedPhone = this.createSanitizedPhone(phoneControl.value);

    if (phoneControl.value === sanitizedPhone) {
      return;
    }

    phoneControl.setValue(sanitizedPhone, {
      emitEvent: false,
    });
  }

  /**
   * Checks whether the touched full-name field is invalid.
   * @returns True when the full-name field should display an error.
   */
  hasNameError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.fullName);
  }

  /**
   * Checks whether the touched email field is invalid.
   * @returns True when the email field should display an error.
   */
  hasEmailError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.email);
  }

  /**
   * Checks whether the touched phone field is invalid.
   * @returns True when the phone field should display an error.
   */
  hasPhoneError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.phone);
  }

  /**
   * Resolves the current full-name validation message.
   * @returns A user-facing validation message or an empty string.
   */
  getNameErrorMessage(): string {
    const control = this.contactForm.controls.fullName;

    if (!control.touched) {
      return '';
    }

    return this.resolveNameErrorMessage(control);
  }

  /**
   * Resolves the matching error message for a touched full-name control.
   * @param control - Full-name control whose validation errors are inspected.
   * @returns Matching validation message or an empty string.
   */
  private resolveNameErrorMessage(control: AbstractControl<string>): string {
    if (control.hasError('required')) {
      return 'Name is required.';
    }

    if (control.hasError('nameHasNumber')) {
      return 'Name must not contain numbers.';
    }

    if (control.hasError('invalidName')) {
      return 'Use letters, spaces, hyphens or apostrophes only.';
    }

    return '';
  }

  /**
   * Resolves the current email validation message.
   * @returns A user-facing validation message or an empty string.
   */
  getEmailErrorMessage(): string {
    const control = this.contactForm.controls.email;

    if (!control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Email is required.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return '';
  }

  /**
   * Resolves the current phone validation message.
   * @returns A user-facing validation message or an empty string.
   */
  getPhoneErrorMessage(): string {
    const control = this.contactForm.controls.phone;

    if (!control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Phone is required.';
    }

    if (control.hasError('pattern')) {
      return 'Only numbers, spaces and one leading + are allowed.';
    }

    return '';
  }

  /**
   * Creates the initials displayed in the edited contact's badge.
   * @returns Uppercase first-name and last-name initials.
   */
  getInitials(): string {
    const contact = this.contact();

    return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
  }

  /**
   * Populates the form with the current contact values.
   */
  private setInitialFormValues(): void {
    const contact = this.contact();

    this.contactForm.setValue({
      fullName: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone ?? '',
    });
  }

  /**
   * Validates the supported characters of a non-empty full name.
   * @param control - Full-name form control to validate.
   * @returns A matching validation error or null for a valid value.
   */
  private validateName(control: AbstractControl<string>): ValidationErrors | null {
    const fullName = control.value.trim();

    if (!fullName) {
      return null;
    }

    if (/\d/.test(fullName)) {
      return { nameHasNumber: true };
    }

    if (!this.namePattern.test(fullName)) {
      return { invalidName: true };
    }

    return null;
  }

  /**
   * Checks whether a form control was touched and remains invalid.
   * @param control - Form control whose state should be inspected.
   * @returns True when the control is touched and invalid.
   */
  private hasTouchedError(control: AbstractControl): boolean {
    return control.touched && control.invalid;
  }

  /**
   * Maps the normalized form values to a contact update payload.
   * @returns Contact changes ready for persistence.
   */
  private createContactPayload(): UpdateContact {
    const fullNameParts = this.contactForm.controls.fullName.value.trim().split(/\s+/);

    const firstName = fullNameParts.shift() ?? '';

    return {
      firstName,
      lastName: fullNameParts.join(' ') || this.fallbackLastName,
      email: this.contactForm.controls.email.value.trim(),
      phone: this.contactForm.controls.phone.value.trim(),
    };
  }

  /**
   * Removes unsupported phone characters and collapses repeated spaces.
   * @param phone - Raw phone value entered by the user.
   * @returns Sanitized phone value.
   */
  private createSanitizedPhone(phone: string): string {
    const validCharactersOnly = phone.replace(/[^\d+\s]/g, '').replace(/\s+/g, ' ');

    return this.normalizePhonePlus(validCharactersOnly.trimStart());
  }

  /**
   * Keeps one leading plus sign and removes every other plus sign.
   * @param phone - Phone value whose plus signs should be normalized.
   * @returns Phone value containing at most one leading plus sign.
   */
  private normalizePhonePlus(phone: string): string {
    if (phone.startsWith('+')) {
      return '+' + phone.slice(1).replace(/\+/g, '');
    }

    return phone.replace(/\+/g, '');
  }
}