import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Permits RFC-compatible characters in the local email part. */
const EMAIL_LOCAL_PART_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

/** Permits valid provider and subdomain labels. */
const EMAIL_DOMAIN_LABEL_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/** Requires an alphabetic top-level domain with at least two letters. */
const EMAIL_TOP_LEVEL_DOMAIN_PATTERN = /^[A-Za-z]{2,63}$/;

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
    hasValidEmailLength(email, localPart) &&
    EMAIL_LOCAL_PART_PATTERN.test(localPart) &&
    hasValidDomain(domain)
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