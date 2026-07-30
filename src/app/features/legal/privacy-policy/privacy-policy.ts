import { Location, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Header } from '../../../layout/header/header';
import { Sidebar } from '../../../layout/sidebar/sidebar';

/**
 * Displays the application's privacy policy.
 *
 * Provides access to the shared application layout and allows the user to
 * return to the previously visited page.
 */
@Component({
  selector: 'app-privacy-policy',
  imports: [Header, Sidebar, NgOptimizedImage],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {
  /** Browser location service used to navigate back in the history. */
  private readonly location = inject(Location);

  /**
   * Navigates back to the previously visited page.
   */
  protected goBack(): void {
    this.location.back();
  }
}