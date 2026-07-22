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

@Component({
  selector: 'app-contact-edit-dialog',
  imports: [ReactiveFormsModule],
  templateUrl:
    './contact-edit-dialog.html',
  styleUrl:
    './contact-edit-dialog.scss',
})
export class ContactEditDialog
  implements OnInit
{
  private readonly closeAnimationMs = 200;

  private readonly fallbackLastName =
    'Unknown';

  private readonly namePattern =
    /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  private readonly phonePattern =
    /^\+?[0-9 ]+$/;

  readonly contact =
    input.required<Contact>();

  readonly cancelled = output<void>();

  readonly submitted =
    output<UpdateContact>();

  readonly deleted = output<string>();

  readonly isClosing = signal(false);

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
        Validators.pattern(
          this.phonePattern,
        ),
      ],
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

    window.setTimeout(
      () => {
        this.cancelled.emit();
      },
      this.closeAnimationMs,
    );
  }

  submitForm(): void {
    this.sanitizePhoneInput();
    this.contactForm.markAllAsTouched();
    this.contactForm
      .updateValueAndValidity();

    if (this.contactForm.invalid) {
      return;
    }

    this.submitted.emit(
      this.createContactPayload(),
    );
  }

  deleteContact(): void {
    this.deleted.emit(this.contact().id);
  }

  sanitizePhoneInput(): void {
    const phoneControl =
      this.contactForm.controls.phone;

    const sanitizedPhone =
      this.createSanitizedPhone(
        phoneControl.value,
      );

    if (
      phoneControl.value ===
      sanitizedPhone
    ) {
      return;
    }

    phoneControl.setValue(
      sanitizedPhone,
      {
        emitEvent: false,
      },
    );
  }

  hasNameError(): boolean {
    return this.hasTouchedError(
      this.contactForm.controls.fullName,
    );
  }

  hasEmailError(): boolean {
    return this.hasTouchedError(
      this.contactForm.controls.email,
    );
  }

  hasPhoneError(): boolean {
    return this.hasTouchedError(
      this.contactForm.controls.phone,
    );
  }

  getNameErrorMessage(): string {
    const control =
      this.contactForm.controls.fullName;

    if (!control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Name is required.';
    }

    if (
      control.hasError('nameHasNumber')
    ) {
      return 'Name must not contain numbers.';
    }

    if (control.hasError('invalidName')) {
      return 'Use letters, spaces, hyphens or apostrophes only.';
    }

    return '';
  }

  getEmailErrorMessage(): string {
    const control =
      this.contactForm.controls.email;

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
    const control =
      this.contactForm.controls.phone;

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

  getInitials(): string {
    const contact = this.contact();

    return (
      contact.firstName.charAt(0) +
      contact.lastName.charAt(0)
    ).toUpperCase();
  }

  private setInitialFormValues(): void {
    const contact = this.contact();

    this.contactForm.setValue({
      fullName:
        `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone ?? '',
    });
  }

  private validateName(
    control: AbstractControl<string>,
  ): ValidationErrors | null {
    const fullName =
      control.value.trim();

    if (!fullName) {
      return null;
    }

    if (/\d/.test(fullName)) {
      return {
        nameHasNumber: true,
      };
    }

    if (
      !this.namePattern.test(fullName)
    ) {
      return {
        invalidName: true,
      };
    }

    return null;
  }

  private hasTouchedError(
    control: AbstractControl,
  ): boolean {
    return (
      control.touched &&
      control.invalid
    );
  }

  private createContactPayload():
    UpdateContact {
    const fullNameParts =
      this.contactForm.controls
        .fullName.value
        .trim()
        .split(/\s+/);

    const firstName =
      fullNameParts.shift() ?? '';

    return {
      firstName,
      lastName:
        fullNameParts.join(' ') ||
        this.fallbackLastName,
      email:
        this.contactForm.controls
          .email.value.trim(),
      phone:
        this.contactForm.controls
          .phone.value.trim(),
    };
  }

  private createSanitizedPhone(
    phone: string,
  ): string {
    const validCharactersOnly = phone
      .replace(/[^\d+\s]/g, '')
      .replace(/\s+/g, ' ');

    return this.normalizePhonePlus(
      validCharactersOnly.trimStart(),
    );
  }

  private normalizePhonePlus(
    phone: string,
  ): string {
    if (phone.startsWith('+')) {
      return (
        '+' +
        phone
          .slice(1)
          .replace(/\+/g, '')
      );
    }

    return phone.replace(/\+/g, '');
  }
}