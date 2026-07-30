import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Provides the shared authentication layout and renders its child route.
 */
@Component({
  selector: 'app-auth-page',
  imports: [RouterOutlet],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {}