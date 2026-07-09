import { Component, input } from '@angular/core';

@Component({
  selector: 'app-contact-success-overlay',
  imports: [],
  templateUrl: './contact-success-overlay.html',
  styleUrl: './contact-success-overlay.scss',
})
export class ContactSuccessOverlay {
  message = input.required<string>();
}