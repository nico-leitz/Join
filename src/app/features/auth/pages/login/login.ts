import { Component, inject, OnDestroy, signal } from '@angular/core';
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
export class Login implements OnDestroy {
  private static hasShownSplash = false;

  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);

  readonly authService = inject(AuthService);
  readonly submitted = signal(false);
  readonly activeLogin = signal<LoginMode>(null);
  readonly showSplash = signal(true);
  readonly isMobile = signal(false);

  private splashTimer?: ReturnType<typeof window.setTimeout>;
  private readonly onResize = (): void => {
    this.isMobile.set(window.innerWidth <= 768);
  };

  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    this.authService.clearError();
    this.onResize();
    window.addEventListener('resize', this.onResize);

    if (Login.hasShownSplash) {
      this.showSplash.set(false);
      return;
    }

    Login.hasShownSplash = true;
    this.splashTimer = window.setTimeout(() => {
      this.showSplash.set(false);
    }, 2400);
  }

  ngOnDestroy(): void {
    if (this.splashTimer) {
      window.clearTimeout(this.splashTimer);
    }

    window.removeEventListener('resize', this.onResize);
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
      await this.navigateToSummary('guest');
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
      await this.navigateToSummary('user');
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
  private navigateToSummary(mode: Exclude<LoginMode, null>): Promise<boolean> {
    this.authService.queueSummaryGreeting(mode);
    return this.router.navigate(['/summary']);
  }
}