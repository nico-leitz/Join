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

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly authRepository = inject(AuthRepository);

  private readonly currentUserState = signal(
    null as ReturnType<typeof mapAuthUser> | null
  );
  private readonly loadingState = signal(false);
  private readonly initializedState = signal(false);
  private readonly errorState = signal<string | null>(null);

  private authSubscription: AuthSubscription | null = null;
  private initializationPromise: Promise<void> | null = null;

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isInitialized = this.initializedState.asReadonly();
  readonly errorMessage = this.errorState.asReadonly();

  readonly isAuthenticated = computed(() => {
    return this.currentUserState() !== null;
  });

  readonly isGuest = computed(() => {
    return this.currentUserState()?.isAnonymous ?? false;
  });

  /**
   * Restores the persisted session and starts the auth listener.
   */
  initialize(): Promise<void> {
    this.initializationPromise ??= this.initializeAuth();

    return this.initializationPromise;
  }

  /**
   * Registers a permanent user after privacy acceptance.
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
   */
  signIn(credentials: LoginCredentials): Promise<boolean> {
    return this.runRequest(
      () => this.performSignIn(credentials),
      false
    );
  }

  /**
   * Creates and activates an anonymous guest session.
   */
  signInAsGuest(): Promise<boolean> {
    return this.runRequest(
      () => this.performGuestSignIn(),
      false
    );
  }

  /**
   * Signs out the active user.
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
   * Releases the Supabase authentication listener.
   */
  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  /**
   * Initializes session state exactly once.
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
   */
  private async performGuestSignIn(): Promise<boolean> {
    const sessionData =
      await this.authRepository.signInAnonymously();

    return this.applyAuthenticatedSession(sessionData);
  }

  /**
   * Completes the sign-out operation.
   */
  private async performSignOut(): Promise<boolean> {
    await this.authRepository.signOut();
    this.currentUserState.set(null);

    return true;
  }

  /**
   * Applies a successful authentication response.
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
   */
  private setUserFromSession(session: Session | null): void {
    const user = session ? mapAuthUser(session.user) : null;

    this.currentUserState.set(user);
  }

  /**
   * Executes one authentication request at a time.
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