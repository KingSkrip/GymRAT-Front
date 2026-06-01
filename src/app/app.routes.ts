import { Routes } from '@angular/router';

import { NoAuthGuard } from './modules/auth/guards/noAuth.guard';

import { AuthGuard } from './modules/auth/guards/auth.guard';

import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  // ROOT
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },

  // LOGIN
  {
    path: 'sign-in',

    canActivate: [NoAuthGuard],

    loadComponent: () =>
      import('./modules/auth/sign-in/sign-in.component').then((m) => m.AuthSignInComponent),
  },

  // FORGOT
  {
    path: 'forgot-password',

    canActivate: [NoAuthGuard],

    loadComponent: () =>
      import('./modules/auth/forgot-password/forgot-password.component').then(
        (m) => m.AuthForgotPasswordComponent,
      ),
  },

  // DASHBOARD CON LAYOUT
  {
    path: '',

    component: LayoutComponent,

    children: [
      {
        path: 'dashboard',

        canActivate: [AuthGuard],

        data: {
          layout: 'vertical',
        },

        loadComponent: () =>
          import('./modules/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
   
      {
        path: 'membresia',

        canActivate: [AuthGuard],

        data: {
          layout: 'vertical',
        },

        loadComponent: () =>
          import('./modules/Cliente/membresia/membresia.component').then((m) => m.MembresiaComponent),
      },


       {
        path: 'asistencias',

        canActivate: [AuthGuard],

        data: {
          layout: 'vertical',
        },

        loadComponent: () =>
          import('./modules/Cliente/Asistencias/asistencias.component').then((m) => m.AsistenciasComponent),
      },

       {
        path: 'rutina',

        canActivate: [AuthGuard],

        data: {
          layout: 'vertical',
        },

        loadComponent: () =>
          import('./modules/Cliente/rutina/rutina.component').then((m) => m.RutinaComponent),
      },
    ],
  },

  // 404
  {
    path: '**',
    redirectTo: 'sign-in',
  },
];
