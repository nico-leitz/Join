import { Location, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Header } from '../../../layout/header/header';
import { Sidebar } from '../../../layout/sidebar/sidebar';

@Component({
  selector: 'app-privacy-policy',
  imports: [Header, Sidebar, NgOptimizedImage],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}
