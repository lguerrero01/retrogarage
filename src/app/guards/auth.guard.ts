import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (!authService.isAuthenticated()) {
    // Mostrar el modal de login
    authService.requestLogin();
    // Permanecer en la página actual (el guard bloqueará la navegación)
    return false;
  }

  // Verificar roles específicos si están definidos en la ruta
  const requiredRole = route.data['requiredRole'] as 'admin' | 'chef' | undefined;

  if (requiredRole) {
    const hasAccess = requiredRole === 'admin'
      ? authService.canAccessAdmin()
      : authService.canAccessKitchen();

    if (!hasAccess) {
      // Redirigir al menú si no tiene permisos
      router.navigate(['/menu']);
      return false;
    }
  }

  return true;
};
