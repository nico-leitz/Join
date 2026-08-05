import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Allows protected routes only after a valid Supabase session was restored.
 * @returns True for authenticated users or a redirect to the login page.
 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    await authService.initialize();
  } catch {
    return router.createUrlTree(['/login']);
  }

  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};