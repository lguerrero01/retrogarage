import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que INITIAL_SESSION haya sido procesado antes de verificar auth
  await authService.ready$;

  if (!authService.isAuthenticated()) {
    authService.requestLogin();
    return router.parseUrl('/menu');
  }

  const requiredRole = route.data['requiredRole'] as 'admin' | 'chef' | undefined;

  if (requiredRole) {
    const hasAccess = requiredRole === 'admin'
      ? authService.canAccessAdmin()
      : authService.canAccessKitchen();

    if (!hasAccess) {
      return router.parseUrl('/menu');
    }
  }

  return true;
};
