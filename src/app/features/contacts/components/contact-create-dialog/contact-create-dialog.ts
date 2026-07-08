import { Component, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
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
  cancelled = output<void>();
  submitted = output<CreateContact>();

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
    }),
  });

  cancel(): void {
    this.cancelled.emit();
  }

  submitForm(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.createContactPayload());
  }

  private createContactPayload(): CreateContact {
    const fullName = this.contactForm.controls.fullName.value.trim();
    const [firstName, ...lastNameParts] = fullName.split(' ');

    return {
      firstName,
      lastName: lastNameParts.join(' ') || firstName,
      email: this.contactForm.controls.email.value.trim(),
      phone: this.contactForm.controls.phone.value.trim() || null,
    };
  }
}