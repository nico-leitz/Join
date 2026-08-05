import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Contact } from '../../../../core/models/contact.model';
import { ContactEditDialog } from './contact-edit-dialog';

let component: ContactEditDialog;
let fixture: ComponentFixture<ContactEditDialog>;

/** Contacts used to initialize the edit-dialog form. */
const mockContacts: Contact[] = [
  {
    id: '1',
    authUserId: 'user-123',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max@test.com',
    phone: null,
    badgeColor: '#ff0000',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: '2',
    authUserId: 'user-456',
    firstName: 'Erika',
    lastName: 'Musterfrau',
    email: 'erika@example.com',
    phone: null,
    badgeColor: '#00ff00',
    createdAt: '2023-02-15T09:30:00Z',
    updatedAt: '2023-02-15T09:30:00Z',
  },
  {
    id: '3',
    authUserId: 'user-789',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@provider.org',
    phone: '0123456789',
    badgeColor: '#0000ff',
    createdAt: '2023-03-10T14:45:00Z',
    updatedAt: '2023-03-10T14:45:00Z',
  },
  {
    id: '4',
    authUserId: 'user-000',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah@resistance.com',
    phone: '9876543210',
    badgeColor: '#ffaa00',
    createdAt: '2023-04-20T10:00:00Z',
    updatedAt: '2023-04-20T10:00:00Z',
  },
  {
    id: '5',
    authUserId: 'user-111',
    firstName: 'Peter',
    lastName: 'Pan',
    email: 'peter@neverland.com',
    phone: null,
    badgeColor: '#880088',
    createdAt: '2023-05-05T08:00:00Z',
    updatedAt: '2023-05-05T08:00:00Z',
  },
];

/** Valid edit-form values used for submission. */
const validFormValue = {
  fullName: 'John Doe',
  email: 'john@test.de',
  phone: '987654',
};

/** Expected normalized payload emitted for the valid form values. */
const expectedContactUpdate = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.de',
  phone: '987654',
};

/** Configures the standalone contact-edit-dialog testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, ContactEditDialog],
  }).compileComponents();
}

/** Creates a rendered contact-edit-dialog fixture. */
async function setupComponent(): Promise<void> {
  await configureTestBed();
  fixture = TestBed.createComponent(ContactEditDialog);
  component = fixture.componentInstance;
  fixture.componentRef.setInput('contact', mockContacts[0]);
  fixture.detectChanges();
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies that the contact input pre-fills the edit form. */
function shouldSetInitialFormValues(): void {
  const form = component.contactForm;
  expect(form.controls.fullName.value).toBe('Max Mustermann');
  expect(form.controls.email.value).toBe('max@test.com');
  expect(form.controls.phone.value).toBe('');
}

/** Verifies detection of an invalid email address. */
function shouldDetectInvalidEmail(): void {
  const emailControl = component.contactForm.controls.email;
  emailControl.setValue('invalid-email-address');
  emailControl.markAllAsTouched();
  expect(emailControl.valid).toBe(false);
  expect(component.hasEmailError()).toBe(true);
}

/** Verifies emission of the normalized update payload. */
function shouldEmitSubmittedContact(): void {
  const emitSpy = vi.spyOn(component.submitted, 'emit');
  component.contactForm.setValue(validFormValue);
  component.submitForm();
  expect(emitSpy).toHaveBeenCalledWith(expectedContactUpdate);
}

/** Verifies emission of the deleted contact identifier. */
function shouldEmitDeletedContactId(): void {
  const emitSpy = vi.spyOn(component.deleted, 'emit');
  component.deleteContact();
  expect(emitSpy).toHaveBeenCalledWith(mockContacts[0].id);
}

/** Registers all contact-edit-dialog component tests. */
function registerContactEditDialogTests(): void {
  beforeEach(setupComponent);
  it('should create the component', shouldCreateComponent);
  it('should set initial form values from the contact input', shouldSetInitialFormValues);
  it('should detect invalid email format', shouldDetectInvalidEmail);
  it('should emit the correct data when the form is submitted', shouldEmitSubmittedContact);
  it('should emit the contact ID when the delete button is clicked', shouldEmitDeletedContactId);
}

describe('ContactEditDialog', registerContactEditDialogTests);