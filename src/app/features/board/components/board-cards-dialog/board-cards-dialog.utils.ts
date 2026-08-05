import { Contact } from '../../../../core/models/contact.model';

/**
 * Formats an ISO-style date for display without timezone conversion.
 * @param dueDate - Date value expected in YYYY-MM-DD format.
 * @returns Date formatted as DD/MM/YYYY or the original invalid value.
 */
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-');
  if (!year || !month || !day) {
    return dueDate;
  }
  return `${day}/${month}/${year}`;
}

/**
 * Creates uppercase initials for a contact.
 * @param contact - Contact whose initials should be created.
 * @returns Combined first and last name initials.
 */
export function getContactInitials(contact: Contact): string {
  return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
}

/**
 * Resolves an input element from a DOM input or change event.
 * @param event - Event whose target contains the current input state.
 * @returns Input element that raised the event.
 */
export function getInputElement(event: Event): HTMLInputElement {
  return event.target as HTMLInputElement;
}

/**
 * Creates the assignment control label for a selected contact count.
 * @param selectedAmount - Number of currently selected contacts.
 * @returns Human-readable contact selection summary.
 */
export function getContactSelectionLabel(selectedAmount: number): string {
  if (selectedAmount === 0) {
    return 'Select contacts to assign';
  }
  return selectedAmount === 1 ? '1 contact selected' : `${selectedAmount} contacts selected`;
}