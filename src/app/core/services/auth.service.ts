import {
  computed,
  Injectable,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { mapAuthErrorMessage } from '../mappers/auth-error.mapper';
import { mapAuthUser } from '../mappers/auth.mapper';
import {
  LoginCredentials,
  SignUpCredentials,
  SignUpResult,
} from '../models/auth.model';
import {
  AuthRepository,
  AuthSessionData,
  AuthSubscription,
} from '../repositories/auth.repository';

/**
 * Defines the greeting variants that can be shown after summary navigation.
 */
type SummaryGreetingMode = 'user' | 'guest';

/**
 * Manages authentication requests and exposes the current session state.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  /** Repository used for Supabase authentication operations. */
  private readonly authRepository = inject(AuthRepository);

  /** Internal state containing the authenticated application user. */
  private readonly currentUserState = signal(
    null as ReturnType<typeof mapAuthUser> | null
  );

  /** Internal state indicating whether an authentication request is running. */
  private readonly loadingState = signal(false);

  /** Internal state indicating whether session restoration has completed. */
  private readonly initializedState = signal(false);

  /** Internal state containing the current user-facing authentication error. */
  private readonly errorState = signal<string | null>(null);

  /** Internal state containing a queued one-time summary greeting. */
  private readonly summaryGreetingModeState = signal<SummaryGreetingMode | null>(
    null
  );

  /** Active authentication listener subscription. */
  private authSubscription: AuthSubscription | null = null;

  /** Shared initialization promise used to prevent duplicate restoration. */
  private initializationPromise: Promise<void> | null = null;

  /** Read-only signal containing the authenticated user or null. */
  readonly currentUser = this.currentUserState.asReadonly();

  /** Read-only signal indicating whether a request is running. */
  readonly isLoading = this.loadingState.asReadonly();

  /** Read-only signal indicating whether authentication was initialized. */
  readonly isInitialized = this.initializedState.asReadonly();

  /** Read-only signal containing the current authentication error message. */
  readonly errorMessage = this.errorState.asReadonly();

  /** Computed signal indicating whether a user is authenticated. */
  readonly isAuthenticated = computed(() => {
    return this.currentUserState() !== null;
  });

  /** Computed signal indicating whether the authenticated user is a guest. */
  readonly isGuest = computed(() => {
    return this.currentUserState()?.isAnonymous ?? false;
  });

  /**
   * Restores the persisted session and starts the auth listener.
   *
   * @returns Shared promise that resolves when initialization is complete.
   */
  initialize(): Promise<void> {
    this.initializationPromise ??= this.initializeAuth();

    return this.initializationPromise;
  }

  /**
   * Registers a permanent user after privacy acceptance.
   *
   * @param credentials - Registration credentials and privacy acceptance state.
   * @returns Registration result or null when validation or registration fails.
   */
  async signUp(
    credentials: SignUpCredentials
  ): Promise<SignUpResult | null> {
    if (!credentials.privacyAccepted) {
      this.errorState.set('Please accept the Privacy Policy.');
      return null;
    }

    return this.runRequest(
      () => this.performSignUp(credentials),
      null
    );
  }

  /**
   * Signs in with email and password.
   *
   * @param credentials - Credentials used for the login request.
   * @returns True when an authenticated session was established.
   */
  signIn(credentials: LoginCredentials): Promise<boolean> {
    return this.runRequest(
      () => this.performSignIn(credentials),
      false
    );
  }

  /**
   * Creates and activates an anonymous guest session.
   *
   * @returns True when an anonymous session was established.
   */
  signInAsGuest(): Promise<boolean> {
    return this.runRequest(
      () => this.performGuestSignIn(),
      false
    );
  }

  /**
   * Signs out the active user.
   *
   * @returns True when the active session was signed out successfully.
   */
  signOut(): Promise<boolean> {
    return this.runRequest(
      () => this.performSignOut(),
      false
    );
  }

  /**
   * Clears the current authentication error.
   */
  clearError(): void {
    this.errorState.set(null);
  }

  /**
   * Queues a one-time mobile greeting for the next summary navigation.
   *
   * @param mode - Greeting variant to queue.
   */
  queueSummaryGreeting(mode: SummaryGreetingMode): void {
    this.summaryGreetingModeState.set(mode);
  }

  /**
   * Consumes and clears the queued summary greeting mode.
   *
   * @returns Queued greeting mode or null when no greeting is pending.
   */
  consumeSummaryGreeting(): SummaryGreetingMode | null {
    const mode = this.summaryGreetingModeState();
    this.summaryGreetingModeState.set(null);

    return mode;
  }

  /**
   * Releases the Supabase authentication listener.
   */
  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  /**
   * Initializes session state exactly once.
   *
   * @returns A promise that resolves after session restoration finishes.
   */
  private async initializeAuth(): Promise<void> {
    this.subscribeToAuthChanges();

    try {
      const session = await this.authRepository.getSession();
      this.setUserFromSession(session);
    } catch (error) {
      this.errorState.set(mapAuthErrorMessage(error));
    } finally {
      this.initializedState.set(true);
    }
  }

  /**
   * Registers the Supabase authentication listener.
   */
  private subscribeToAuthChanges(): void {
    if (this.authSubscription) {
      return;
    }

    this.authSubscription =
      this.authRepository.onAuthStateChange((_event, session) => {
        this.setUserFromSession(session);
      });
  }

  /**
   * Completes the registration operation.
   *
   * @param credentials - Validated registration credentials.
   * @returns Registered user and email confirmation requirement.
   * @throws The authentication error returned by the repository.
   */
  private async performSignUp(
    credentials: SignUpCredentials
  ): Promise<SignUpResult> {
    const sessionData =
      await this.authRepository.signUp(credentials);
    const user = mapAuthUser(sessionData.user);

    if (sessionData.session) {
      this.currentUserState.set(user);
    }

    return {
      user,
      requiresEmailConfirmation: !sessionData.session,
    };
  }

  /**
   * Completes the password sign-in operation.
   *
   * @param credentials - Credentials used for the login request.
   * @returns True when an authenticated session was applied.
   * @throws The authentication error returned by the repository.
   * @throws An error when the response does not contain a session.
   */
  private async performSignIn(
    credentials: LoginCredentials
  ): Promise<boolean> {
    const sessionData =
      await this.authRepository.signIn(credentials);

    return this.applyAuthenticatedSession(sessionData);
  }

  /**
   * Completes the anonymous sign-in operation.
   *
   * @returns True when an authenticated guest session was applied.
   * @throws The authentication error returned by the repository.
   * @throws An error when the response does not contain a session.
   */
  private async performGuestSignIn(): Promise<boolean> {
    const sessionData =
      await this.authRepository.signInAnonymously();

    return this.applyAuthenticatedSession(sessionData);
  }

  /**
   * Completes the sign-out operation.
   *
   * @returns True when the repository signs out successfully.
   * @throws The authentication error returned by the repository.
   */
  private async performSignOut(): Promise<boolean> {
    await this.authRepository.signOut();
    this.currentUserState.set(null);

    return true;
  }

  /**
   * Applies a successful authentication response.
   *
   * @param sessionData - User and session returned by authentication.
   * @returns True after the authenticated user state is updated.
   * @throws An error when the response does not contain a session.
   */
  private applyAuthenticatedSession(
    sessionData: AuthSessionData
  ): boolean {
    if (!sessionData.session) {
      throw new Error(
        'Authentication response did not contain a session.'
      );
    }

    this.currentUserState.set(mapAuthUser(sessionData.user));

    return true;
  }

  /**
   * Updates the current user from a Supabase session.
   *
   * @param session - Active Supabase session or null after sign-out.
   */
  private setUserFromSession(session: Session | null): void {
    const user = session ? mapAuthUser(session.user) : null;

    this.currentUserState.set(user);
  }

  /**
   * Executes one authentication request at a time.
   *
   * @param request - Authentication operation to execute.
   * @param fallback - Value returned when the request is blocked or fails.
   * @returns Request result or the provided fallback value.
   */
  private async runRequest<T>(
    request: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    if (this.loadingState()) {
      return fallback;
    }

    this.startRequest();

    try {
      return await request();
    } catch (error) {
      this.errorState.set(mapAuthErrorMessage(error));
      return fallback;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Starts a clean authentication request.
   */
  private startRequest(): void {
    this.errorState.set(null);
    this.loadingState.set(true);
  }
}