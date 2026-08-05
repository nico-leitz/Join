import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SignUpCredentials } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import {
  fullNameValidator,
  passwordsMatchValidator,
  passwordStrengthValidator,
  strictEmailValidator,
} from './signup.utils';

/** Names of controls belonging to the signup form. */
type SignupControlName = 'fullName' | 'email' | 'password' | 'confirmPassword' | 'privacyAccepted';

/** Time the signup success feedback remains visible before login navigation. */
const SUCCESS_MESSAGE_DURATION_MS = 2600;

/**
 * Provides account registration through the authentication service.
 *
 * Manages signup validation, credential normalization and success feedback
 * before returning newly registered users to the login page.
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

  /** Controls the centered signup success feedback. */
  readonly showSuccessMessage = signal(false);

  /** Indicates whether the main password field is currently focused. */
  passwordFocused = false;

  /** Controls the visibility of the text in the main password field. */
  passwordVisible = false;

  /** Indicates whether the confirmation password field is currently focused. */
  confirmPasswordFocused = false;

  /** Controls the visibility of the text in the confirmation password field. */
  confirmPasswordVisible = false;

  /** Reactive form containing registration and privacy fields. */
  readonly signupForm = this.formBuilder.group(
    {
      fullName: ['', [Validators.required, fullNameValidator]],
      email: ['', [Validators.required, strictEmailValidator]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
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
   * @returns A promise that resolves after registration feedback and navigation.
   */
  async onSubmit(): Promise<void> {
    this.submitted.set(true);

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();

      return;
    }

    const success = await this.authService.signUp(this.buildCredentials());

    if (!success) {
      return;
    }

    await this.completeSuccessfulSignup();
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
   * @param controlName - Name of the control to inspect.
   * @returns True when the control is invalid and should show an error.
   */
  isControlInvalid(controlName: SignupControlName): boolean {
    const control = this.signupForm.controls[controlName];

    return control.invalid && (control.touched || this.submitted());
  }

  /**
   * Determines whether the password confirmation error should be displayed.
   * @returns True when both password values differ and the error is visible.
   */
  hasPasswordMismatch(): boolean {
    const confirmation = this.signupForm.controls.confirmPassword;

    return (
      this.signupForm.hasError('passwordMismatch') && (confirmation.touched || this.submitted())
    );
  }

  /**
   * Toggles the visibility state of the main password input.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Toggles the visibility state of the confirmation password input.
   */
  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  /**
   * Determines the correct icon path based on the current focus and visibility state.
   * @param isFocused - Whether the specific input field currently has focus.
   * @param isVisible - Whether the password text is currently set to visible.
   * @returns The file path to the corresponding SVG icon.
   */
  getIconSrc(isFocused: boolean, isVisible: boolean): string {
    if (isVisible) {
      return 'assets/sign-up/visibility.svg';
    }
    if (isFocused) {
      return 'assets/sign-up/visibility_off.svg';
    }
    return 'assets/sign-up/lock.svg';
  }

  /**
   * Creates normalized credentials from the current form values.
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
   * Ends the temporary signup session and returns the user to login.
   */
  private async completeSuccessfulSignup(): Promise<void> {
    const signedOut = await this.authService.signOut();

    if (!signedOut) {
      return;
    }

    this.showSuccessMessage.set(true);
    await this.waitForSuccessMessage();
    this.showSuccessMessage.set(false);
    await this.router.navigate(['/login']);
  }

  /**
   * Keeps the success feedback visible for its animation duration.
   * @returns A promise that resolves when the feedback has finished.
   */
  private waitForSuccessMessage(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, SUCCESS_MESSAGE_DURATION_MS);
    });
  }
}