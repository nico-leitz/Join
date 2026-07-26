import { User } from '@supabase/supabase-js';
import { AuthUser } from '../models/auth.model';

interface NameParts {
  firstName: string;
  lastName: string;
}

export interface AuthUserMetadata {
  first_name: string;
  last_name: string;
  full_name: string;
}

/**
 * Creates normalized metadata for a Supabase sign-up request.
 */
export function createAuthUserMetadata(
  fullName: string
): AuthUserMetadata {
  const normalizedName = normalizeFullName(fullName);
  const nameParts = splitFullName(normalizedName);

  return {
    first_name: nameParts.firstName,
    last_name: nameParts.lastName,
    full_name: normalizedName,
  };
}

/**
 * Maps a Supabase user to the application user model.
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
 * Normalizes whitespace in a full name.
 */
function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ');
}

/**
 * Splits a normalized full name into contact-compatible values.
 */
function splitFullName(fullName: string): NameParts {
  const [firstName, ...lastNameParts] = fullName.split(' ');

  return {
    firstName: firstName || 'User',
    lastName: lastNameParts.join(' ') || 'Unknown',
  };
}

/**
 * Resolves the display name stored in Supabase user metadata.
 */
function resolveUserFullName(user: User): string {
  const fullName = readMetadataValue(user, 'full_name');

  if (fullName) {
    return normalizeFullName(fullName);
  }

  return resolveNameParts(user);
}

/**
 * Combines separate metadata values into a display name.
 */
function resolveNameParts(user: User): string {
  const firstName = readMetadataValue(user, 'first_name');
  const lastName = readMetadataValue(user, 'last_name');
  const resolvedName = normalizeFullName(`${firstName} ${lastName}`);

  return resolvedName || (user.is_anonymous ? 'Guest' : 'User');
}

/**
 * Safely reads a string from user metadata.
 */
function readMetadataValue(user: User, key: string): string {
  const value = user.user_metadata?.[key];

  return typeof value === 'string' ? value.trim() : '';
}