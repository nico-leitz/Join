import { Component, inject } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  protected readonly isAuthenticated =
    this.authService.isAuthenticated;
}