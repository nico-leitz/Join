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

@Component({
  selector: 'app-contact-create-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-create-dialog.html',
  styleUrl: './contact-create-dialog.scss',
})
export class ContactCreateDialog {
  private readonly closeAnimationMs = 200;
  private readonly fallbackLastName = 'Unknown';
  private readonly namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß' -]+$/;
  private readonly phonePattern = /^\+?[0-9 ]+$/;

  cancelled = output<void>();
  submitted = output<CreateContact>();
  isClosing = signal(false);

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

  cancel(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    window.setTimeout(() => this.cancelled.emit(), this.closeAnimationMs);
  }

  submitForm(): void {
    this.sanitizePhoneInput();
    this.contactForm.markAllAsTouched();
    this.contactForm.updateValueAndValidity();

    if (this.contactForm.invalid) {
      return;
    }

    this.submitted.emit(this.createContactPayload());
  }

  sanitizePhoneInput(): void {
    const phoneControl = this.contactForm.controls.phone;
    const sanitizedPhone = this.createSanitizedPhone(phoneControl.value);

    if (phoneControl.value !== sanitizedPhone) {
      phoneControl.setValue(sanitizedPhone, { emitEvent: false });
    }
  }

  hasNameError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.fullName);
  }

  hasEmailError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.email);
  }

  hasPhoneError(): boolean {
    return this.hasTouchedError(this.contactForm.controls.phone);
  }

  getNameErrorMessage(): string {
    const control = this.contactForm.controls.fullName;

    if (!control.touched) return '';
    if (control.hasError('required')) return 'Name is required.';
    if (control.hasError('nameHasNumber')) return 'Name must not contain numbers.';
    if (control.hasError('invalidName')) return 'Use letters, spaces, hyphens or apostrophes only.';

    return '';
  }

  getEmailErrorMessage(): string {
    const control = this.contactForm.controls.email;

    if (!control.touched) return '';
    if (control.hasError('required')) return 'Email is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';

    return '';
  }

  getPhoneErrorMessage(): string {
    const control = this.contactForm.controls.phone;

    if (!control.touched) return '';
    if (control.hasError('required')) return 'Phone is required.';
    if (control.hasError('pattern')) return 'Only numbers, spaces and one leading + are allowed.';

    return '';
  }

  private validateName(control: AbstractControl<string>): ValidationErrors | null {
    const fullName = control.value.trim();

    if (!fullName) return null;
    if (/\d/.test(fullName)) return { nameHasNumber: true };
    if (!this.namePattern.test(fullName)) return { invalidName: true };

    return null;
  }

  private hasTouchedError(control: AbstractControl): boolean {
    return control.touched && control.invalid;
  }

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

  private createSanitizedPhone(phone: string): string {
    const validCharactersOnly = phone.replace(/[^\d+\s]/g, '').replace(/\s+/g, ' ');
    return this.normalizePhonePlus(validCharactersOnly.trimStart());
  }

  private normalizePhonePlus(phone: string): string {
    if (phone.startsWith('+')) {
      return `+${phone.slice(1).replace(/\+/g, '')}`;
    }

    return phone.replace(/\+/g, '');
  }
}