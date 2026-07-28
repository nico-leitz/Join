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

type SignupControlName =
  | 'fullName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'privacyAccepted';

/**
 * Checks whether both password fields contain the same value.
 */
function passwordsMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmPassword')?.value;

  return password === confirmation
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);

  readonly authService = inject(AuthService);
  readonly submitted = signal(false);

  readonly signupForm = this.formBuilder.group(
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
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      privacyAccepted: [
        false,
        Validators.requiredTrue,
      ],
    },
    {
      validators: passwordsMatchValidator,
    }
  );

  constructor() {
    this.authService.clearError();
  }

  /**
   * Submits valid signup credentials through the auth service.
   */
  async onSubmit(): Promise<void> {
    this.submitted.set(true);

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const result = await this.authService.signUp(
      this.buildCredentials()
    );

    if (result) {
      await this.navigateAfterSignup(
        result.requiresEmailConfirmation
      );
    }
  }

  /**
   * Clears an outdated backend error after form changes.
   */
  onFormChange(): void {
    if (this.authService.errorMessage()) {
      this.authService.clearError();
    }
  }

  /**
   * Returns whether a control error should be displayed.
   */
  isControlInvalid(controlName: SignupControlName): boolean {
    const control = this.signupForm.controls[controlName];

    return control.invalid
      && (control.touched || this.submitted());
  }

  /**
   * Returns whether the password confirmation differs.
   */
  hasPasswordMismatch(): boolean {
    const confirmation =
      this.signupForm.controls.confirmPassword;

    return this.signupForm.hasError('passwordMismatch')
      && (confirmation.touched || this.submitted());
  }

  /**
   * Builds normalized signup credentials.
   */
  private buildCredentials(): SignUpCredentials {
    const formValue = this.signupForm.getRawValue();

    return {
      fullName: formValue.fullName.trim(),
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
      privacyAccepted: formValue.privacyAccepted,
    };
  }

  /**
   * Navigates according to the returned signup session state.
   */
  private navigateAfterSignup(
    requiresEmailConfirmation: boolean
  ): Promise<boolean> {
    const target = requiresEmailConfirmation
      ? '/login'
      : '/summary';

    return this.router.navigate([target]);
  }
}