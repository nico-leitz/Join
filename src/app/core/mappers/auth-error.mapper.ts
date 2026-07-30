import { isAuthApiError } from '@supabase/supabase-js';

/**
 * Fallback message for unknown or unsupported authentication errors.
 */
const DEFAULT_AUTH_ERROR =
  'Authentication failed. Please try again.';

/**
 * Maps supported Supabase authentication error codes to safe UI messages.
 */
const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_credentials: 'Invalid email or password.',
  email_not_confirmed:
    'Please confirm your email before logging in.',
  email_exists:
    'An account with this email already exists.',
  user_already_exists:
    'An account with this email already exists.',
  weak_password:
    'The password does not meet the security requirements.',
  email_address_invalid:
    'Please enter a valid email address.',
  email_address_not_authorized:
    'Confirmation emails cannot be sent to this address.',
  over_email_send_rate_limit:
    'Too many emails were sent. Please try again later.',
  over_request_rate_limit:
    'Too many requests. Please try again later.',
  anonymous_provider_disabled:
    'Guest login is currently unavailable.',
  signup_disabled:
    'Registration is currently unavailable.',
  email_provider_disabled:
    'Registration is currently unavailable.',
  captcha_failed:
    'The security check failed. Please try again.',
  request_timeout:
    'The authentication service did not respond.',
  unexpected_failure:
    'The authentication service is currently unavailable.',
  session_expired:
    'Your session has expired. Please log in again.',
  session_not_found:
    'Your session has expired. Please log in again.',
};

/**
 * Maps a Supabase authentication error to a safe UI message.
 *
 * @param error - Unknown error returned by an authentication request.
 * @returns Matching user-facing message or the default error message.
 */
export function mapAuthErrorMessage(error: unknown): string {
  if (!isAuthApiError(error) || !error.code) {
    return DEFAULT_AUTH_ERROR;
  }

  return AUTH_ERROR_MESSAGES[error.code] ?? DEFAULT_AUTH_ERROR;
}