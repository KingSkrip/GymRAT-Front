import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { of, switchMap } from 'rxjs';
import { AuthService } from '../auth.service';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.check().pipe(
    switchMap((authenticated) => {
      if (!authenticated) {
        const redirectURL = state.url !== '/' ? `?redirectURL=${state.url}` : '';
        return of(router.parseUrl(`sign-in${redirectURL}`));
      }
      return of(true);
    })
  );
};
