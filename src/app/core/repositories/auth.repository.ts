import { Injectable, inject } from '@angular/core';
import {
  AuthChangeEvent,
  Session,
  User,
} from '@supabase/supabase-js';
import { createAuthUserMetadata } from '../mappers/auth.mapper';
import {
  LoginCredentials,
  SignUpCredentials,
} from '../models/auth.model';
import { SupabaseService } from '../supabase/supabase';

/**
 * Contains the registration fields accepted by the repository.
 */
type SignUpPayload = Pick<
  SignUpCredentials,
  'fullName' | 'email' | 'password'
>;

/**
 * Contains the user and session returned by an authentication request.
 */
export interface AuthSessionData {
  /** Authenticated Supabase user. */
  user: User;

  /** Active session or null when email confirmation is still required. */
  session: Session | null;
}

/**
 * Represents a subscription to authentication state changes.
 */
export interface AuthSubscription {
  /**
   * Stops receiving authentication state changes.
   */
  unsubscribe(): void;
}

/**
 * Handles a Supabase authentication state change.
 *
 * @param event - Authentication event emitted by Supabase.
 * @param session - Current session or null when no session is active.
 */
export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null
) => void;

/**
 * Provides direct access to Supabase authentication operations.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthRepository {
  /** Supabase client used for authentication requests. */
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Registers a permanent Supabase user with normalized metadata.
   *
   * @param credentials - Registration credentials.
   * @returns Registered user and the resulting session state.
   * @throws The authentication error returned by Supabase.
   * @throws An error when the response does not contain a user.
   */
  async signUp(credentials: SignUpPayload): Promise<AuthSessionData> {
    const metadata = createAuthUserMetadata(credentials.fullName);
    const { data, error } = await this.supabase.auth.signUp({
      email: credentials.email.trim(),
      password: credentials.password,
      options: { data: metadata },
    });

    this.throwIfError(error);

    return this.requireUser(data.user, data.session);
  }

  /**
   * Signs in a permanent user with an email address and password.
   *
   * @param credentials - User login credentials.
   * @returns Authenticated user and active session.
   * @throws The authentication error returned by Supabase.
   * @throws An error when the response does not contain a user.
   */
  async signIn(
    credentials: LoginCredentials
  ): Promise<AuthSessionData> {
    const { data, error } =
      await this.supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

    this.throwIfError(error);

    return this.requireUser(data.user, data.session);
  }

  /**
   * Creates and signs in an anonymous guest user.
   *
   * @returns Anonymous user and active session.
   * @throws The authentication error returned by Supabase.
   * @throws An error when the response does not contain a user.
   */
  async signInAnonymously(): Promise<AuthSessionData> {
    const { data, error } =
      await this.supabase.auth.signInAnonymously();

    this.throwIfError(error);

    return this.requireUser(data.user, data.session);
  }

  /**
   * Retrieves the locally persisted Supabase session.
   *
   * @returns Persisted session or null when no session exists.
   * @throws The authentication error returned by Supabase.
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();

    this.throwIfError(error);

    return data.session;
  }

  /**
   * Subscribes to Supabase authentication state changes.
   *
   * @param callback - Function invoked for each authentication change.
   * @returns Subscription used to stop receiving changes.
   */
  onAuthStateChange(
    callback: AuthStateChangeCallback
  ): AuthSubscription {
    return this.supabase.auth.onAuthStateChange(callback)
      .data.subscription;
  }

  /**
   * Signs out the active Supabase session.
   *
   * @returns A promise that resolves after the session is removed.
   * @throws The authentication error returned by Supabase.
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    this.throwIfError(error);
  }

  /**
   * Throws a Supabase authentication error when one is present.
   *
   * @param error - Authentication error or null for a successful request.
   * @throws The provided error when it is not null.
   */
  private throwIfError(error: Error | null): void {
    if (error) {
      throw error;
    }
  }

  /**
   * Ensures that a successful authentication response contains a user.
   *
   * @param user - User returned by Supabase.
   * @param session - Session returned by Supabase.
   * @returns Validated authentication response data.
   * @throws An error when the response does not contain a user.
   */
  private requireUser(
    user: User | null,
    session: Session | null
  ): AuthSessionData {
    if (!user) {
      throw new Error('Authentication response did not contain a user.');
    }

    return { user, session };
  }
}