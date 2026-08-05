import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/** Displays the application header and manages its user menu. */
@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class Header {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly menuOpen = signal(false);
  protected readonly isAuthenticated = this.authService.isAuthenticated;

  protected readonly profileInitials = computed(() => {
    const user = this.authService.currentUser();

    if (!user) {
      return 'U';
    }

    if (user.isAnonymous) {
      return 'G';
    }

    return this.createInitials(user.fullName);
  });

  /**
   * Opens or closes the user menu.
   */
  protected toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  /**
   * Closes the user menu.
   */
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  /**
   * Signs out and removes the persisted Supabase session.
   */
  protected async onLogout(): Promise<void> {
    this.closeMenu();

    const success = await this.authService.signOut();

    if (success) {
      await this.router.navigate(['/login']);
    }
  }

  /**
   * Closes the menu after a click outside the header.
   * @param event - Document click event used to identify the target.
   */
  protected onDocumentClick(event: Event): void {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }

  /**
   * Creates initials from the first and last name.
   * @param fullName - Full name used to derive the initials.
   * @returns Uppercase initials or the default user initial.
   */
  private createInitials(fullName: string): string {
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

    const firstName = nameParts.at(0) ?? '';
    const lastName = nameParts.length > 1 ? (nameParts.at(-1) ?? '') : '';

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  }
}