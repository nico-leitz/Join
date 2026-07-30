import { Component, input } from '@angular/core';

/**
 * Displays a transient success message after a contact operation.
 */
@Component({
  selector: 'app-contact-success-overlay',
  imports: [],
  templateUrl: './contact-success-overlay.html',
  styleUrl: './contact-success-overlay.scss',
})
export class ContactSuccessOverlay {
  /** Success message rendered inside the overlay. */
  message = input.required<string>();
}