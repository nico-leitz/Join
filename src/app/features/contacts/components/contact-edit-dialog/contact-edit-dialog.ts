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

  contact = input.required<Contact>();

  cancelled = output<void>();
  submitted = output<UpdateContact>();
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
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.createContactPayload());
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
}