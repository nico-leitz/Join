/**
 * Logic for the login component.
 * Handles authentication, splash timing, and password visibility.
 */

import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { strictEmailValidator } from './login.utils';

/** Names of controls belonging to the login form. */
type LoginControlName = 'email' | 'password';

/** Identifies the active login request or an idle state. */
type LoginMode = 'user' | 'guest' | null;

/** Pixel values used as the final splash-logo destination. */
interface SplashTarget {
  top: string;
  left: string;
  width: string;
}

/**
 * Provides email and anonymous guest authentication.
 * Manages form validation, authentication requests, splash visibility,
 * password visibility toggling, and navigation to the protected summary page.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  /** Tracks whether the splash screen was already displayed. */
  private static hasShownSplash = false;

  /** Delay allowing the initial centered logo state to render first. */
  private static readonly SPLASH_START_DELAY_MS = 80;

  /** Must match the splash animation duration defined in SCSS. */
  private static readonly SPLASH_ANIMATION_DURATION_MS = 2400;

  /** Non-nullable form builder used to construct the login form. */
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  /** Router used after successful authentication. */
  private readonly router = inject(Router);

  /** Visible header logo used as the exact splash-animation target. */
  private readonly headerLogo = viewChild<ElementRef<HTMLImageElement>>('headerLogo');

  /** Authentication service exposed to the login template. */
  readonly authService = inject(AuthService);

  /** Indicates whether the login form was submitted. */
  readonly submitted = signal(false);

  /** Identifies the authentication request currently running. */
  readonly activeLogin = signal<LoginMode>(null);

  /** Controls visibility of the initial splash screen. */
  readonly showSplash = signal(true);

  /** Starts the logo movement only after its destination was measured. */
  readonly splashAnimating = signal(false);

  /** Indicates whether the current viewport uses the mobile layout. */
  readonly isMobile = signal(false);

  /** Exact viewport position and width of the visible header logo. */
  readonly splashTarget = signal<SplashTarget>({
    top: '3rem',
    left: '5rem',
    width: '5.5rem',
  });

  /** Indicates whether the password text is currently visible. */
  passwordVisible = false;

  /** Indicates whether the password input field currently holds focus. */
  passwordFocused = false;

  /** Identifier of the timer that starts the splash movement. */
  private splashStartTimer?: ReturnType<typeof window.setTimeout>;

  /** Identifier of the timer that removes the completed splash screen. */
  private splashTimer?: ReturnType<typeof window.setTimeout>;

  /** Updates the mobile viewport state after a resize. */
  private readonly onResize = (): void => {
    this.isMobile.set(window.innerWidth <= 768);
    this.updateSplashTarget();
  };

  /** Reactive form containing the email login credentials. */
  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, strictEmailValidator]],
    password: ['', Validators.required],
  });

  /**
   * Initializes authentication errors, viewport tracking and splash state.
   */
  constructor() {
    this.authService.clearError();
    this.onResize();

    window.addEventListener('resize', this.onResize);

    if (Login.hasShownSplash) {
      this.showSplash.set(false);
      return;
    }

    Login.hasShownSplash = true;
    afterNextRender(() => this.queueSplashAnimation());
  }

  /** Recalculates the target and queues the animation after the asset loaded. */
  onHeaderLogoLoad(): void {
    this.updateSplashTarget();
    this.queueSplashAnimation();
  }

  /**
   * Clears the splash timer and removes the resize listener.
   */
  ngOnDestroy(): void {
    if (this.splashStartTimer !== undefined) {
      window.clearTimeout(this.splashStartTimer);
    }

    if (this.splashTimer) {
      window.clearTimeout(this.splashTimer);
    }

    window.removeEventListener('resize', this.onResize);
  }

  /**
   * Determines the appropriate icon path for password fields.
   * @param isFocused - Indicates whether the input field currently holds focus.
   * @param isVisible - Indicates whether the password text is currently unmasked.
   * @returns The relative path to the correct SVG asset.
   */
  getIconSrc(isFocused: boolean, isVisible: boolean): string {
    if (!isFocused && !isVisible) {
      return 'assets/sign-up/lock.svg';
    }
    return isVisible ? 'assets/sign-up/visibility.svg' : 'assets/sign-up/visibility_off.svg';
  }

  /**
   * Toggles the visibility state of the password input field.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Validates and submits the email login.
   * @returns A promise that resolves after the login attempt.
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
   * @returns A promise that resolves after the guest login attempt.
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
  isControlInvalid(controlName: LoginControlName): boolean {
    const control = this.loginForm.controls[controlName];

    return control.invalid && (control.touched || this.submitted());
  }

  /**
   * Sends normalized login credentials to the authentication service.
   * @returns A promise that resolves after authentication and navigation.
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
   * Creates normalized credentials from the current form values.
   * @returns Credentials accepted by the authentication service.
   */
  private buildCredentials(): LoginCredentials {
    const formValue = this.loginForm.getRawValue();

    return {
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
    };
  }

  /** Reads the rendered header-logo bounds for a breakpoint-independent target. */
  private updateSplashTarget(): void {
    const bounds = this.headerLogo()?.nativeElement.getBoundingClientRect();

    if (!bounds || bounds.width <= 0) {
      return;
    }

    this.splashTarget.set({
      top: `${bounds.top}px`,
      left: `${bounds.left}px`,
      width: `${bounds.width}px`,
    });
  }

  /**
   * Lets the centered state render before activating the movement class.
   */
  private queueSplashAnimation(): void {
    if (!this.canQueueSplashAnimation()) {
      return;
    }

    this.updateSplashTarget();
    this.splashStartTimer = window.setTimeout(
      () => this.prepareSplashAnimation(),
      Login.SPLASH_START_DELAY_MS,
    );
  }

  /**
   * Returns whether a splash animation can still be scheduled.
   * @returns True when no splash animation is active or queued.
   */
  private canQueueSplashAnimation(): boolean {
    return this.showSplash() && !this.splashAnimating() && this.splashStartTimer === undefined;
  }

  /** Refreshes the destination immediately before starting the movement. */
  private prepareSplashAnimation(): void {
    this.splashStartTimer = undefined;
    this.updateSplashTarget();
    this.startSplashAnimation();
  }

  /** Starts the movement and removes the overlay after it has faded out. */
  private startSplashAnimation(): void {
    if (!this.showSplash()) {
      return;
    }

    this.splashAnimating.set(true);
    this.splashTimer = window.setTimeout(() => {
      this.showSplash.set(false);
      this.splashTimer = undefined;
    }, Login.SPLASH_ANIMATION_DURATION_MS);
  }

  /**
   * Queues the appropriate greeting and navigates to the summary page.
   * @param mode - Successful user or guest login mode.
   * @returns A promise containing the router navigation result.
   */
  private navigateToSummary(mode: Exclude<LoginMode, null>): Promise<boolean> {
    this.authService.queueSummaryGreeting(mode);

    return this.router.navigate(['/summary']);
  }
}