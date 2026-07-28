import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';

type LoginControlName = 'email' | 'password';
type LoginMode = 'user' | 'guest' | null;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);

  readonly authService = inject(AuthService);
  readonly submitted = signal(false);
  readonly activeLogin = signal<LoginMode>(null);

  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    this.authService.clearError();
  }

  /**
   * Validates and submits the email login.
   */
  async onSubmit(): Promise<void> {
    this.submitted.set(true);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    await this.performLogin();
  }

  /**
   * Starts an anonymous guest session.
   */
  async onGuestLogin(): Promise<void> {
    this.activeLogin.set('guest');
    const success = await this.authService.signInAsGuest();
    this.activeLogin.set(null);

    if (success) {
      await this.navigateToSummary();
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
  isControlInvalid(controlName: LoginControlName): boolean {
    const control = this.loginForm.controls[controlName];

    return control.invalid && (control.touched || this.submitted());
  }

  /**
   * Sends normalized login credentials to the auth service.
   */
  private async performLogin(): Promise<void> {
    this.activeLogin.set('user');
    const success = await this.authService.signIn(this.buildCredentials());
    this.activeLogin.set(null);

    if (success) {
      await this.navigateToSummary();
    }
  }

  /**
   * Builds normalized login credentials.
   */
  private buildCredentials(): LoginCredentials {
    const formValue = this.loginForm.getRawValue();

    return {
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
    };
  }

  /**
   * Navigates to the protected summary page.
   */
  private navigateToSummary(): Promise<boolean> {
    return this.router.navigate(['/summary']);
  }
}