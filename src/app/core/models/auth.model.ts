/**
 * Contains the credentials required for a permanent user login.
 */
export interface LoginCredentials {
  /** Email address associated with the user account. */
  email: string;

  /** Password used to authenticate the user. */
  password: string;
}

/**
 * Contains the data required to register a permanent user.
 */
export interface SignUpCredentials {
  /** Full name entered during registration. */
  fullName: string;

  /** Email address used for the new account. */
  email: string;

  /** Password used for the new account. */
  password: string;

  /** Indicates whether the privacy policy was accepted. */
  privacyAccepted: boolean;
}

/**
 * Represents an authenticated user within the application.
 */
export interface AuthUser {
  /** Unique Supabase user identifier. */
  id: string;

  /** User email or null for users without an email address. */
  email: string | null;

  /** Resolved display name of the user. */
  fullName: string;

  /** Indicates whether the account is an anonymous guest account. */
  isAnonymous: boolean;
}

/**
 * Represents the result of a successful registration request.
 */
export interface SignUpResult {
  /** Registered application user. */
  user: AuthUser;

  /** Indicates whether the user must confirm their email before login. */
  requiresEmailConfirmation: boolean;
}