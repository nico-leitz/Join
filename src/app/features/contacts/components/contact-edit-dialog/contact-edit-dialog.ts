import {
  Component,
  OnInit,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Contact,
  UpdateContact,
} from '../../../../core/models/contact.model';

/**
 * Component for editing an existing contact via a modal dialog.
 * 
 * @remarks
 * This component handles the reactive form for updating contact details,
 * validates inputs, sanitizes phone numbers, and manages the lifecycle 
 * of update or delete requests.
 * 
 * @public
 */
@Component({
  selector: 'app-contact-edit-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-edit-dialog.html',
  styleUrl: './contact-edit-dialog.scss',
})
export class ContactEditDialog implements OnInit {
  /** @internal Duration of the closing animation in milliseconds. */
  private readonly closeAnimationMs = 200;

  /** @internal Fallback value if no last name is provided. */
  private readonly fallbackLastName = 'Unknown';

  /** @internal Regex pattern for validating names. */
  private readonly namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  /** @internal Regex pattern for validating phone numbers. */
  private readonly phonePattern = /^\+?[0-9 ]+$/;

  /** The contact data to be edited. Required input. */
  readonly contact = input.required<Contact>();

  /** Event emitted when the edit process is cancelled. */
  readonly cancelled = output<void>();

  /** Event emitted when the update form is submitted. */
  readonly submitted = output<UpdateContact>();

  /** Event emitted when a request to delete the contact is triggered. */
  readonly deleted = output<string>();

  /** Signal tracking whether the dialog is in the closing state. */
  readonly isClosing = signal(false);

  /** Reactive form group for contact fields. */
  readonly contactForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        this.validateName.bind(this),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
      ],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(this.phonePattern),
      ],
    }),
  });

  /** @public Lifecycle hook to initialize the form values. */
  ngOnInit(): void {
    this.setInitialFormValues();
  }

  /**
   * Cancels the edit process and triggers the closing animation.
   * @public
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
   * Emits the delete event using the contact's ID.
   * @public
   */
  deleteContact(): void {
    this.deleted.emit(this.contact().id);
  }

  /**
   * Sanitizes the phone input based on predefined patterns.
   * @public
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

    if (!control.touched) {
      return '';
    }

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

  /** @public Returns the error message for the email field. */
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

  /** @public Returns the error message for the phone field. */
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
   * Calculates the initials for the contact currently being edited.
   * @returns The capitalized initials.
   * @public
   */
  getInitials(): string {
    const contact = this.contact();

    return (
      contact.firstName.charAt(0) +
      contact.lastName.charAt(0)
    ).toUpperCase();
  }

  /** @internal Populates the form with existing contact data. */
  private setInitialFormValues(): void {
    const contact = this.contact();

    this.contactForm.setValue({
      fullName: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone ?? '',
    });
  }

  /** @internal Custom validator for the name input. */
  private validateName(control: AbstractControl<string>): ValidationErrors | null {
    const fullName = control.value.trim();

    if (!fullName) {
      return null;
    }

    if (/\d/.test(fullName)) {
      return {
        nameHasNumber: true,
      };
    }

    if (!this.namePattern.test(fullName)) {
      return {
        invalidName: true,
      };
    }

    return null;
  }

  /** @internal Helper to check if a control is touched and invalid. */
  private hasTouchedError(control: AbstractControl): boolean {
    return control.touched && control.invalid;
  }

  /** @internal Maps form data to the UpdateContact model payload. */
  private createContactPayload(): UpdateContact {
    const fullNameParts = this.contactForm.controls.fullName.value
      .trim()
      .split(/\s+/);

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
    const validCharactersOnly = phone
      .replace(/[^\d+\s]/g, '')
      .replace(/\s+/g, ' ');

    return this.normalizePhonePlus(validCharactersOnly.trimStart());
  }

  /** @internal Ensures the phone number starts with a single '+' if needed. */
  private normalizePhonePlus(phone: string): string {
    if (phone.startsWith('+')) {
      return '+' + phone.slice(1).replace(/\+/g, '');
    }

    return phone.replace(/\+/g, '');
  }
}