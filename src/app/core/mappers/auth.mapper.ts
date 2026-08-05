import { User } from '@supabase/supabase-js';
import { AuthUser } from '../models/auth.model';

/**
 * Contains the separated parts of a normalized full name.
 */
interface NameParts {
  /** First name or its fallback value. */
  firstName: string;

  /** Last name or its fallback value. */
  lastName: string;
}

/**
 * Represents the user metadata stored during Supabase registration.
 */
export interface AuthUserMetadata {
  /** User's first name. */
  first_name: string;

  /** User's last name. */
  last_name: string;

  /** User's normalized full name. */
  full_name: string;
}

/**
 * Creates normalized user metadata for a Supabase sign-up request.
 * @param fullName - Full name entered during registration.
 * @returns Metadata containing normalized full and separated names.
 */
export function createAuthUserMetadata(fullName: string): AuthUserMetadata {
  const normalizedName = normalizeFullName(fullName);
  const nameParts = splitFullName(normalizedName);

  return {
    first_name: nameParts.firstName,
    last_name: nameParts.lastName,
    full_name: normalizedName,
  };
}

/**
 * Maps a Supabase user to the application's authentication user model.
 * @param user - Supabase user to transform.
 * @returns Application authentication user.
 */
export function mapAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: resolveUserFullName(user),
    isAnonymous: user.is_anonymous ?? false,
  };
}

/**
 * Trims a full name and reduces consecutive whitespace.
 * @param fullName - Full name to normalize.
 * @returns Normalized full name.
 */
function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ');
}

/**
 * Splits a normalized full name into contact-compatible name values.
 * @param fullName - Normalized full name to split.
 * @returns Separated first and last names with safe fallback values.
 */
function splitFullName(fullName: string): NameParts {
  const [firstName, ...lastNameParts] = fullName.split(' ');

  return {
    firstName: firstName || 'User',
    lastName: lastNameParts.join(' ') || 'Unknown',
  };
}

/**
 * Resolves the best available display name from user metadata.
 * @param user - Supabase user containing the metadata.
 * @returns Normalized display name.
 */
function resolveUserFullName(user: User): string {
  const fullName = readMetadataValue(user, 'full_name');

  if (fullName) {
    return normalizeFullName(fullName);
  }

  return resolveNameParts(user);
}

/**
 * Combines separate metadata name values or returns a user-type fallback.
 * @param user - Supabase user containing the metadata.
 * @returns Combined name or the appropriate fallback name.
 */
function resolveNameParts(user: User): string {
  const firstName = readMetadataValue(user, 'first_name');
  const lastName = readMetadataValue(user, 'last_name');
  const resolvedName = normalizeFullName(`${firstName} ${lastName}`);

  return resolvedName || (user.is_anonymous ? 'Guest' : 'User');
}

/**
 * Safely reads and trims a string value from user metadata.
 * @param user - Supabase user containing the metadata.
 * @param key - Metadata property to read.
 * @returns Trimmed metadata value or an empty string.
 */
function readMetadataValue(user: User, key: string): string {
  const value = user.user_metadata?.[key];

  return typeof value === 'string' ? value.trim() : '';
}