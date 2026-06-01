import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { of, switchMap } from 'rxjs';
import { AuthService } from '../auth.service';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const authService: AuthService = inject(AuthService);

    // Verificar la autenticación
    return authService.check().pipe(
        switchMap((authenticated) => {
            if (!authenticated) {
                // Redirigir al login si no está autenticado
                const redirectURL = state.url ? `redirectURL=${state.url}` : '';
                const urlTree = router.parseUrl(`sign-in?${redirectURL}`);
                return of(urlTree);
            }

            // Usuario autenticado, permitir acceso
            return of(true);
        })
    );
};
