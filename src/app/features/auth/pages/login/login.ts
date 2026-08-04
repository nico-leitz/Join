/**
 * @fileoverview Logic for the login component.
 * Handles user authentication, guest login, splash screen timing, and password visibility.
 */

import { Component, inject, OnDestroy, signal } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { LoginCredentials } from "../../../../core/models/auth.model";
import { AuthService } from "../../../../core/services/auth.service";

/** Names of controls belonging to the login form. */
type LoginControlName = "email" | "password";

/** Identifies the active login request or an idle state. */
type LoginMode = "user" | "guest" | null;

/** Permits the RFC-compatible characters supported in the local email part. */
const EMAIL_LOCAL_PART_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

/** Permits valid provider and subdomain labels. */
const EMAIL_DOMAIN_LABEL_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/** Requires an alphabetic top-level domain containing at least two letters. */
const EMAIL_TOP_LEVEL_DOMAIN_PATTERN = /^[A-Za-z]{2,63}$/;

/**
 * Validates the complete syntactic structure of an email address.
 *
 * @param control - Email control to validate.
 * @returns A strict email error or null when the structure is valid.
 */
function strictEmailValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const email = String(control.value ?? "").trim();

  if (!email) {
    return null;
  }

  const parts = email.split("@");

  if (parts.length !== 2) {
    return { strictEmail: true };
  }

  const [localPart, domain] = parts;
  const domainLabels = domain.split(".");
  const topLevelDomain = domainLabels.at(-1) ?? "";
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
 * @description Provides email and anonymous guest authentication.
 *
 * Manages form validation, authentication requests, splash visibility,
 * password visibility toggling, and navigation to the protected summary page.
 */
@Component({
  selector: "app-login",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./login.html",
  styleUrl: "./login.scss",
})
export class Login implements OnDestroy {
  /** Tracks whether the splash screen was already displayed. */
  private static hasShownSplash = false;

  /** Non-nullable form builder used to construct the login form. */
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  /** Router used after successful authentication. */
  private readonly router = inject(Router);

  /** Authentication service exposed to the login template. */
  readonly authService = inject(AuthService);

  /** Indicates whether the login form was submitted. */
  readonly submitted = signal(false);

  /** Identifies the authentication request currently running. */
  readonly activeLogin = signal<LoginMode>(null);

  /** Controls visibility of the initial splash screen. */
  readonly showSplash = signal(true);

  /** Indicates whether the current viewport uses the mobile layout. */
  readonly isMobile = signal(false);

  /** Indicates whether the password text is currently visible. */
  passwordVisible = false;

  /** Indicates whether the password input field currently holds focus. */
  passwordFocused = false;

  /** Identifier of the pending splash-screen timer. */
  private splashTimer?: ReturnType<typeof window.setTimeout>;

  /** Updates the mobile viewport state after a resize. */
  private readonly onResize = (): void => {
    this.isMobile.set(window.innerWidth <= 768);
  };

  /** Reactive form containing the email login credentials. */
  readonly loginForm = this.formBuilder.group({
    email: ["", [Validators.required, strictEmailValidator]],
    password: ["", Validators.required],
  });

  /**
   * Initializes authentication errors, viewport tracking and splash state.
   */
  constructor() {
    this.authService.clearError();
    this.onResize();

    window.addEventListener("resize", this.onResize);

    if (Login.hasShownSplash) {
      this.showSplash.set(false);
      return;
    }

    Login.hasShownSplash = true;

    this.splashTimer = window.setTimeout(() => {
      this.showSplash.set(false);
    }, 2400);
  }

  /**
   * Clears the splash timer and removes the resize listener.
   */
  ngOnDestroy(): void {
    if (this.splashTimer) {
      window.clearTimeout(this.splashTimer);
    }

    window.removeEventListener("resize", this.onResize);
  }

  /**
   * Determines the appropriate icon path for password fields.
   *
   * @param isFocused - Indicates whether the input field currently holds focus.
   * @param isVisible - Indicates whether the password text is currently unmasked.
   * @returns The relative path to the correct SVG asset.
   */
  getIconSrc(isFocused: boolean, isVisible: boolean): string {
    if (!isFocused && !isVisible) {
      return "assets/sign-up/lock.svg";
    }
    return isVisible
      ? "assets/sign-up/visibility.svg"
      : "assets/sign-up/visibility_off.svg";
  }

  /**
   * Toggles the visibility state of the password input field.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Validates and submits the email login.
   *
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
   *
   * @returns A promise that resolves after the guest login attempt.
   */
  async onGuestLogin(): Promise<void> {
    this.activeLogin.set("guest");

    const success = await this.authService.signInAsGuest();

    this.activeLogin.set(null);

    if (success) {
      await this.navigateToSummary("guest");
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
  isControlInvalid(controlName: LoginControlName): boolean {
    const control = this.loginForm.controls[controlName];

    return control.invalid && (control.touched || this.submitted());
  }

  /**
   * Sends normalized login credentials to the authentication service.
   *
   * @returns A promise that resolves after authentication and navigation.
   */
  private async performLogin(): Promise<void> {
    this.activeLogin.set("user");

    const success = await this.authService.signIn(this.buildCredentials());

    this.activeLogin.set(null);

    if (success) {
      await this.navigateToSummary("user");
    }
  }

  /**
   * Creates normalized credentials from the current form values.
   *
   * @returns Credentials accepted by the authentication service.
   */
  private buildCredentials(): LoginCredentials {
    const formValue = this.loginForm.getRawValue();

    return {
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
    };
  }

  /**
   * Queues the appropriate greeting and navigates to the summary page.
   *
   * @param mode - Successful user or guest login mode.
   * @returns A promise containing the router navigation result.
   */
  private navigateToSummary(mode: Exclude<LoginMode, null>): Promise<boolean> {
    this.authService.queueSummaryGreeting(mode);

    return this.router.navigate(["/summary"]);
  }
}