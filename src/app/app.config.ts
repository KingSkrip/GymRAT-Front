import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideIcons } from './core/icons/icons.provider';
import { UserService } from './core/user/user.service';
import { authInterceptor } from './modules/auth/auth.interceptor';

function initializeApp(userService: UserService) {
  return () => userService.init().toPromise();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    ...provideIcons(),
    provideRouter(routes, withComponentInputBinding(), 
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [UserService],
      multi: true,
    },
  ],
};