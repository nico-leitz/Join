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

type SignUpPayload = Pick<
  SignUpCredentials,
  'fullName' | 'email' | 'password'
>;

export interface AuthSessionData {
  user: User;
  session: Session | null;
}

export interface AuthSubscription {
  unsubscribe(): void;
}

export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null
) => void;

@Injectable({
  providedIn: 'root',
})
export class AuthRepository {
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Registers a permanent Supabase user.
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
   * Signs in a permanent user with email and password.
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
   */
  async signInAnonymously(): Promise<AuthSessionData> {
    const { data, error } =
      await this.supabase.auth.signInAnonymously();

    this.throwIfError(error);

    return this.requireUser(data.user, data.session);
  }

  /**
   * Returns the locally persisted Supabase session.
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();

    this.throwIfError(error);

    return data.session;
  }

  /**
   * Subscribes to Supabase authentication state changes.
   */
  onAuthStateChange(
    callback: AuthStateChangeCallback
  ): AuthSubscription {
    return this.supabase.auth.onAuthStateChange(callback)
      .data.subscription;
  }

  /**
   * Signs out the active Supabase session.
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    this.throwIfError(error);
  }

  /**
   * Throws a Supabase authentication error when present.
   */
  private throwIfError(error: Error | null): void {
    if (error) {
      throw error;
    }
  }

  /**
   * Ensures that a successful response contains a user.
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