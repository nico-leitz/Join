import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Minimum number of alphabetic characters required in a name. */
const MINIMUM_NAME_LETTERS = 6;

/** Permits Unicode letters separated by spaces, hyphens or apostrophes. */
const FULL_NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '\u2019-]\p{L}[\p{L}\p{M}]*)*$/u;

/** Permits RFC-compatible characters in the local email part. */
const EMAIL_LOCAL_PART_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

/** Permits valid provider and subdomain labels. */
const EMAIL_DOMAIN_LABEL_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/** Requires an alphabetic top-level domain with at least two letters. */
const EMAIL_TOP_LEVEL_DOMAIN_PATTERN = /^[A-Za-z]{2,63}$/;

/**
 * Validates a human name without excluding international letters.
 * @param control - Name control to validate.
 * @returns Detailed name errors or null when the name is valid.
 */
export function fullNameValidator(control: AbstractControl): ValidationErrors | null {
  const normalizedName = normalizeName(control.value);

  if (!normalizedName) {
    return { required: true };
  }

  const errors = collectNameErrors(normalizedName);
  return Object.keys(errors).length ? errors : null;
}

/**
 * Normalizes whitespace in a form-control value.
 * @param value - Raw value supplied by the name control.
 * @returns Trimmed name containing single spaces.
 */
function normalizeName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Collects all supported full-name validation errors.
 * @param name - Normalized name to inspect.
 * @returns Validation errors found in the name.
 */
function collectNameErrors(name: string): ValidationErrors {
  const errors: ValidationErrors = {};
  addMinimumLetterError(name, errors);

  if (!FULL_NAME_PATTERN.test(name)) {
    errors['invalidNameCharacters'] = true;
  }

  return errors;
}

/**
 * Adds the minimum-letter error when required.
 * @param name - Normalized name to inspect.
 * @param errors - Validation error collection to update.
 */
function addMinimumLetterError(name: string, errors: ValidationErrors): void {
  const letterCount = name.match(/\p{L}/gu)?.length ?? 0;

  if (letterCount < MINIMUM_NAME_LETTERS) {
    errors['minLetters'] = { required: MINIMUM_NAME_LETTERS, actual: letterCount };
  }
}

/**
 * Validates the complete syntactic structure of an email address.
 * @param control - Email control to validate.
 * @returns A strict email error or null when the structure is valid.
 */
export function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  const email = String(control.value ?? '').trim();

  if (!email) {
    return null;
  }

  return isValidEmail(email) ? null : { strictEmail: true };
}

/**
 * Checks all supported email syntax rules.
 * @param email - Normalized email address to inspect.
 * @returns True when the email satisfies every syntax rule.
 */
function isValidEmail(email: string): boolean {
  const parts = email.split('@');

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  return (
    hasValidEmailLength(email, localPart) && isValidLocalPart(localPart) && hasValidDomain(domain)
  );
}

/**
 * Checks the complete and local-part email length limits.
 * @param email - Complete email address.
 * @param localPart - Text preceding the at sign.
 * @returns True when both length limits are satisfied.
 */
function hasValidEmailLength(email: string, localPart: string): boolean {
  return email.length <= 254 && localPart.length <= 64;
}

/**
 * Checks the local-part syntax.
 * @param localPart - Text preceding the at sign.
 * @returns True when the local part satisfies the supported syntax.
 */
function isValidLocalPart(localPart: string): boolean {
  return EMAIL_LOCAL_PART_PATTERN.test(localPart);
}

/**
 * Checks provider labels and the top-level domain.
 * @param domain - Domain portion following the at sign.
 * @returns True when the domain has a provider and valid top-level domain.
 */
function hasValidDomain(domain: string): boolean {
  const domainLabels = domain.split('.');
  const topLevelDomain = domainLabels.at(-1) ?? '';
  const providerLabels = domainLabels.slice(0, -1);

  return (
    hasValidProviderLabels(providerLabels) && EMAIL_TOP_LEVEL_DOMAIN_PATTERN.test(topLevelDomain)
  );
}

/**
 * Checks whether all provider labels satisfy domain syntax.
 * @param providerLabels - Provider and subdomain labels to inspect.
 * @returns True when at least one valid provider label exists.
 */
function hasValidProviderLabels(providerLabels: string[]): boolean {
  return (
    providerLabels.length > 0 &&
    providerLabels.every((label) => EMAIL_DOMAIN_LABEL_PATTERN.test(label))
  );
}

/**
 * Validates the required password character groups.
 * @param control - Password control to validate.
 * @returns Detailed strength errors or null when all groups are present.
 */
export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const password = String(control.value ?? '');

  if (!password) {
    return null;
  }

  const errors = collectPasswordErrors(password);
  return Object.keys(errors).length ? errors : null;
}

/**
 * Collects all supported password-strength errors.
 * @param password - Password value to inspect.
 * @returns Validation errors found in the password.
 */
function collectPasswordErrors(password: string): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!/[A-Z]/.test(password)) {
    errors['missingUppercase'] = true;
  }
  if (!/[0-9]/.test(password)) {
    errors['missingNumber'] = true;
  }

  return errors;
}

/**
 * Checks whether both password fields contain the same value.
 * @param control - Signup form group containing the password controls.
 * @returns A password mismatch error or null when both values match.
 */
export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmPassword')?.value;

  return password === confirmation ? null : { passwordMismatch: true };
}