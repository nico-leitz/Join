import { Location, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';

@Component({
  selector: 'app-help',
  imports: [Header, Sidebar, NgOptimizedImage],
  templateUrl: './help.html',
  styleUrl: './help.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Help {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}