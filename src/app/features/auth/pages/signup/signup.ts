import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SignUpCredentials } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';

/** Names of controls belonging to the signup form. */
type SignupControlName =
  | 'fullName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'privacyAccepted';

/** Minimum number of alphabetic characters required in a name. */
const MINIMUM_NAME_LETTERS = 6;

/** Permits Unicode letters separated by spaces, hyphens or apostrophes. */
const FULL_NAME_PATTERN =
  /^\p{L}[\p{L}\p{M}]*(?:[ '\u2019-]\p{L}[\p{L}\p{M}]*)*$/u;

/** Permits the RFC-compatible characters supported in the local email part. */
const EMAIL_LOCAL_PART_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

/** Permits valid provider and subdomain labels. */
const EMAIL_DOMAIN_LABEL_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/** Requires an alphabetic top-level domain containing at least two letters. */
const EMAIL_TOP_LEVEL_DOMAIN_PATTERN = /^[A-Za-z]{2,63}$/;

/**
 * Validates a human name without excluding international letters.
 *
 * @param control - Name control to validate.
 * @returns Detailed name errors or null when the name is valid.
 */
function fullNameValidator(control: AbstractControl): ValidationErrors | null {
  const normalizedName = String(control.value ?? '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!normalizedName) {
    return { required: true };
  }

  const letterCount = normalizedName.match(/\p{L}/gu)?.length ?? 0;
  const errors: ValidationErrors = {};

  if (letterCount < MINIMUM_NAME_LETTERS) {
    errors['minLetters'] = {
      required: MINIMUM_NAME_LETTERS,
      actual: letterCount,
    };
  }

  if (!FULL_NAME_PATTERN.test(normalizedName)) {
    errors['invalidNameCharacters'] = true;
  }

  return Object.keys(errors).length ? errors : null;
}

/**
 * Validates the complete syntactic structure of an email address.
 *
 * The provider's actual existence must be verified outside the browser.
 *
 * @param control - Email control to validate.
 * @returns A strict email error or null when the structure is valid.
 */
function strictEmailValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const email = String(control.value ?? '').trim();

  if (!email) {
    return null;
  }

  const parts = email.split('@');

  if (parts.length !== 2) {
    return { strictEmail: true };
  }

  const [localPart, domain] = parts;
  const domainLabels = domain.split('.');
  const topLevelDomain = domainLabels.at(-1) ?? '';
  const providerLabels = domainLabels.slice(0, -1);

  const hasValidLength = email.length <= 254 && localPart.length <= 64;
  const hasValidLocalPart = EMAIL_LOCAL_PART_PATTERN.test(localPart);
  const hasValidDomain =
    providerLabels.length > 0 &&
    providerLabels.every((label) => EMAIL_DOMAIN_LABEL_PATTERN.test(label));
  const hasValidTopLevelDomain =
    EMAIL_TOP_LEVEL_DOMAIN_PATTERN.test(topLevelDomain);

  return hasValidLength &&
    hasValidLocalPart &&
    hasValidDomain &&
    hasValidTopLevelDomain
    ? null
    : { strictEmail: true };
}

/**
 * Validates the required password character groups.
 *
 * @param control - Password control to validate.
 * @returns Detailed strength errors or null when all groups are present.
 */
function passwordStrengthValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = String(control.value ?? '');

  if (!password) {
    return null;
  }

  const errors: ValidationErrors = {};

  if (!/[A-Z]/.test(password)) {
    errors['missingUppercase'] = true;
  }

  if (!/[0-9]/.test(password)) {
    errors['missingNumber'] = true;
  }

  return Object.keys(errors).length ? errors : null;
}

/**
 * Checks whether both password fields contain the same value.
 *
 * @param control - Signup form group containing the password controls.
 * @returns A password mismatch error or null when both values match.
 */
function passwordsMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;

  const confirmation = control.get('confirmPassword')?.value;

  return password === confirmation ? null : { passwordMismatch: true };
}

/**
 * Provides account registration through the authentication service.
 *
 * Manages signup validation, credential normalization and navigation
 * according to the returned email-confirmation state.
 */
@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  /** Non-nullable form builder used to construct the signup form. */
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  /** Router used after successful registration. */
  private readonly router = inject(Router);

  /** Authentication service exposed to the signup template. */
  readonly authService = inject(AuthService);

  /** Indicates whether the signup form was submitted. */
  readonly submitted = signal(false);

  /** Reactive form containing registration and privacy fields. */
  readonly signupForm = this.formBuilder.group(
    {
      fullName: ['', [Validators.required, fullNameValidator]],
      email: ['', [Validators.required, strictEmailValidator]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          passwordStrengthValidator,
        ],
      ],
      confirmPassword: ['', Validators.required],
      privacyAccepted: [false, Validators.requiredTrue],
    },
    {
      validators: passwordsMatchValidator,
    },
  );

  /**
   * Clears authentication errors left by a previous request.
   */
  constructor() {
    this.authService.clearError();
  }

  /**
   * Validates and submits the signup form.
   *
   * @returns A promise that resolves after registration and navigation.
   */
  async onSubmit(): Promise<void> {
    this.submitted.set(true);

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();

      return;
    }

    const result = await this.authService.signUp(this.buildCredentials());

    if (result) {
      await this.navigateAfterSignup(result.requiresEmailConfirmation);
    }
  }

  /**
   * Clears an outdated authentication error after form changes.
   */
  onFormChange(): void {
    if (this.authService.errorMessage()) {
      this.authService.clearError();
    }
  }

  /**
   * Determines whether a form control error should be displayed.
   *
   * @param controlName - Name of the control to inspect.
   * @returns True when the control is invalid and should show an error.
   */
  isControlInvalid(controlName: SignupControlName): boolean {
    const control = this.signupForm.controls[controlName];

    return control.invalid && (control.touched || this.submitted());
  }

  /**
   * Determines whether the password confirmation error should be displayed.
   *
   * @returns True when both password values differ and the error is visible.
   */
  hasPasswordMismatch(): boolean {
    const confirmation = this.signupForm.controls.confirmPassword;

    return (
      this.signupForm.hasError('passwordMismatch') &&
      (confirmation.touched || this.submitted())
    );
  }

  /**
   * Creates normalized credentials from the current form values.
   *
   * @returns Credentials accepted by the authentication service.
   */
  private buildCredentials(): SignUpCredentials {
    const formValue = this.signupForm.getRawValue();

    return {
      fullName: formValue.fullName.trim().replace(/\s+/g, ' '),
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
      privacyAccepted: formValue.privacyAccepted,
    };
  }

  /**
   * Navigates according to the returned email-confirmation state.
   *
   * @param requiresEmailConfirmation - Whether confirmation is required.
   * @returns A promise containing the router navigation result.
   */
  private navigateAfterSignup(
    requiresEmailConfirmation: boolean,
  ): Promise<boolean> {
    const target = requiresEmailConfirmation ? '/login' : '/summary';

    return this.router.navigate([target]);
  }
}