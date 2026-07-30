import {
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Router,
  RouterLink,
} from '@angular/router';
import { SignUpCredentials } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';

/** Names of controls belonging to the signup form. */
type SignupControlName =
  | 'fullName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'privacyAccepted';

/**
 * Checks whether both password fields contain the same value.
 *
 * @param control - Signup form group containing the password controls.
 * @returns A password mismatch error or null when both values match.
 */
function passwordsMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password =
    control.get('password')?.value;

  const confirmation =
    control.get(
      'confirmPassword',
    )?.value;

  return password === confirmation
    ? null
    : { passwordMismatch: true };
}

/**
 * Provides account registration through the authentication service.
 *
 * Manages signup validation, credential normalization and navigation
 * according to the returned email-confirmation state.
 */
@Component({
  selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  /** Non-nullable form builder used to construct the signup form. */
  private readonly formBuilder =
    inject(FormBuilder).nonNullable;

  /** Router used after successful registration. */
  private readonly router =
    inject(Router);

  /** Authentication service exposed to the signup template. */
  readonly authService =
    inject(AuthService);

  /** Indicates whether the signup form was submitted. */
  readonly submitted =
    signal(false);

  /** Reactive form containing registration and privacy fields. */
  readonly signupForm =
    this.formBuilder.group(
      {
        fullName: [
          '',
          [
            Validators.required,
            Validators.pattern(/\S/),
          ],
        ],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
          ],
        ],
        password: [
          '',
          Validators.required,
        ],
        confirmPassword: [
          '',
          Validators.required,
        ],
        privacyAccepted: [
          false,
          Validators.requiredTrue,
        ],
      },
      {
        validators:
          passwordsMatchValidator,
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
      this.signupForm
        .markAllAsTouched();

      return;
    }

    const result =
      await this.authService.signUp(
        this.buildCredentials(),
      );

    if (result) {
      await this.navigateAfterSignup(
        result
          .requiresEmailConfirmation,
      );
    }
  }

  /**
   * Clears an outdated authentication error after form changes.
   */
  onFormChange(): void {
    if (
      this.authService.errorMessage()
    ) {
      this.authService.clearError();
    }
  }

  /**
   * Determines whether a form control error should be displayed.
   *
   * @param controlName - Name of the control to inspect.
   * @returns True when the control is invalid and should show an error.
   */
  isControlInvalid(
    controlName: SignupControlName,
  ): boolean {
    const control =
      this.signupForm
        .controls[controlName];

    return (
      control.invalid &&
      (
        control.touched ||
        this.submitted()
      )
    );
  }

  /**
   * Determines whether the password confirmation error should be displayed.
   *
   * @returns True when both password values differ and the error is visible.
   */
  hasPasswordMismatch(): boolean {
    const confirmation =
      this.signupForm.controls
        .confirmPassword;

    return (
      this.signupForm.hasError(
        'passwordMismatch',
      ) &&
      (
        confirmation.touched ||
        this.submitted()
      )
    );
  }

  /**
   * Creates normalized credentials from the current form values.
   *
   * @returns Credentials accepted by the authentication service.
   */
  private buildCredentials():
    SignUpCredentials
  {
    const formValue =
      this.signupForm.getRawValue();

    return {
      fullName:
        formValue.fullName.trim(),
      email:
        formValue.email
          .trim()
          .toLowerCase(),
      password: formValue.password,
      privacyAccepted:
        formValue.privacyAccepted,
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
    const target =
      requiresEmailConfirmation
        ? '/login'
        : '/summary';

    return this.router.navigate([
      target,
    ]);
  }
}