import { Component, input, OnInit, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Contact, UpdateContact } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-contact-edit-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-edit-dialog.html',
  styleUrl: './contact-edit-dialog.scss',
})
export class ContactEditDialog implements OnInit {
  private readonly closeAnimationMs = 220;
  private readonly phonePattern = /^\+?[0-9]+(?: [0-9]+)?$/;

  contact = input.required<Contact>();

  cancelled = output<void>();
  submitted = output<UpdateContact>();
  deleted = output<string>();

  isClosing = signal(false);

  contactForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(this.phonePattern)],
    }),
  });

  ngOnInit(): void {
    this.setInitialFormValues();
  }

  cancel(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);

    window.setTimeout(() => {
      this.cancelled.emit();
    }, this.closeAnimationMs);
  }

  submitForm(): void {
    this.sanitizePhoneInput();

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.createContactPayload());
  }

  deleteContact(): void {
    this.deleted.emit(this.contact().id);
  }

  sanitizePhoneInput(): void {
    const phoneControl = this.contactForm.controls.phone;
    const sanitizedPhone = this.createSanitizedPhone(phoneControl.value);

    if (phoneControl.value !== sanitizedPhone) {
      phoneControl.setValue(sanitizedPhone, { emitEvent: false });
    }
  }

  hasNameError(): boolean {
    const control = this.contactForm.controls.fullName;
    return control.touched && control.invalid;
  }

  hasEmailError(): boolean {
    const control = this.contactForm.controls.email;
    return control.touched && control.invalid;
  }

  hasPhoneError(): boolean {
    const control = this.contactForm.controls.phone;
    return control.touched && control.invalid;
  }

  getNameErrorMessage(): string {
    const control = this.contactForm.controls.fullName;

    if (!control.touched || !control.hasError('required')) {
      return '';
    }

    return 'Name is required.';
  }

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

  getPhoneErrorMessage(): string {
    const control = this.contactForm.controls.phone;

    if (!control.touched || !control.hasError('pattern')) {
      return '';
    }

    return 'Only +, numbers and one space are allowed.';
  }

  getInitials(): string {
    const contact = this.contact();

    return `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
  }

  private setInitialFormValues(): void {
    const contact = this.contact();

    this.contactForm.setValue({
      fullName: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone ?? '',
    });
  }

  private createContactPayload(): UpdateContact {
    const fullName = this.contactForm.controls.fullName.value.trim();
    const [firstName, ...lastNameParts] = fullName.split(' ');

    return {
      firstName,
      lastName: lastNameParts.join(' ') || firstName,
      email: this.contactForm.controls.email.value.trim(),
      phone: this.contactForm.controls.phone.value.trim() || null,
    };
  }

  private createSanitizedPhone(phone: string): string {
    const validCharactersOnly = phone.replace(/[^\d+ ]/g, '');
    const normalizedPlus = this.normalizePhonePlus(validCharactersOnly);

    return this.keepOnlyFirstPhoneSpace(normalizedPlus);
  }

  private normalizePhonePlus(phone: string): string {
    if (phone.startsWith('+')) {
      return `+${phone.slice(1).replace(/\+/g, '')}`;
    }

    return phone.replace(/\+/g, '');
  }

  private keepOnlyFirstPhoneSpace(phone: string): string {
    const singleSpacedPhone = phone.replace(/\s+/g, ' ');
    const firstSpaceIndex = singleSpacedPhone.indexOf(' ');

    if (firstSpaceIndex === -1) {
      return singleSpacedPhone;
    }

    return (
      singleSpacedPhone.slice(0, firstSpaceIndex + 1) +
      singleSpacedPhone.slice(firstSpaceIndex + 1).replace(/ /g, '')
    );
  }
}