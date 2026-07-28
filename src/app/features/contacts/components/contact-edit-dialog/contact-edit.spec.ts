import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Contact } from '../../../../core/models/contact.model';
import { ContactEditDialog } from './contact-edit-dialog';

/**
 * @description Test suite for the ContactEditDialog component.
 * Verifies that the edit form initializes, validates inputs, and emits events correctly.
 */
describe('ContactEditDialog', () => {
  let component: ContactEditDialog;
  let fixture: ComponentFixture<ContactEditDialog>;

  const MOCK_CONTACTS: Contact[] = [
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
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ContactEditDialog]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactEditDialog);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('contact', MOCK_CONTACTS[0]);
    fixture.detectChanges();
  });

  /**
   * @test Ensures the component instance is successfully created.
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Validates that the form fields are pre-filled with the contact input data.
   */
  it('should set initial form values from the contact input', () => {
    const form = component.contactForm;
    expect(form.controls.fullName.value).toBe('Max Mustermann');
    expect(form.controls.email.value).toBe('max@test.com');
    expect(form.controls.phone.value).toBe('');
  });

  /**
   * @test Verifies that the email validation logic correctly flags invalid input.
   */
  it('should detect invalid email format', () => {
    const emailControl = component.contactForm.controls.email;
    emailControl.setValue('invalid-email-address');

    emailControl.markAllAsTouched();
    
    expect(emailControl.valid).toBe(false);
    expect(component.hasEmailError()).toBe(true);
  });

  /**
   * @test Confirms that the component emits the correct payload when the submit action is triggered.
   */
  it('should emit the correct data when the form is submitted', () => {
    const spy = vi.spyOn(component.submitted, 'emit');

    component.contactForm.setValue({
      fullName: 'John Doe',
      email: 'john@test.de',
      phone: '987654'
    });

    component.submitForm();

    expect(spy).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.de',
      phone: '987654'
    });
  });

  /**
   * @test Checks that the delete event is emitted with the correct contact ID.
   */
  it('should emit the contact ID when the delete button is clicked', () => {
    const spy = vi.spyOn(component.deleted, 'emit');
    
    component.deleteContact();
    
    expect(spy).toHaveBeenCalledWith(MOCK_CONTACTS[0].id);
  });
});