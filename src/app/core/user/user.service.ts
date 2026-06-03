import { HttpClient } from '@angular/common/http';
import { Inject, PLATFORM_ID, Injectable, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map, Observable, of, ReplaySubject, Subject, take, tap } from 'rxjs';
import { User } from './user.types';
import { APP_CONFIG } from '../../core/config/app-config';
import { AuthUtils } from '../../modules/auth/auth.utils';

@Injectable({ providedIn: 'root' })
export class UserService {
  private _httpClient = inject(HttpClient);
  private _user: ReplaySubject<User | null> = new ReplaySubject<User | null>(1);
  private apiUrl = APP_CONFIG.apiUrl;
  private _openProfileDrawer = new Subject<void>();
  openProfileDrawer$ = this._openProfileDrawer.asObservable();

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  /**
   * Setter & getter for user
   */
  set user(value: User) {
    this._user.next(value);
  }

  get user$(): Observable<User | null> {
    return this._user.asObservable();
  }

  /**
   * Get current user synchronously (usar con precaución)
   */
  get user(): User | null {
    let currentUser: User | null = null;
    this._user.pipe(take(1)).subscribe((user) => (currentUser = user));
    return currentUser;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

init(): Observable<void> {
  let token: string | null = null;

  if (isPlatformBrowser(this.platformId)) {
    token = localStorage.getItem('encrypt');
  }

  // Sin token o token expirado → limpiar y salir sin llamar al backend
  if (!token || AuthUtils.isTokenExpired(token)) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('encrypt');
    }
    this._user.next(null);
    return of(void 0);
  }

  return this._httpClient
    .get(`${this.apiUrl}dash/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .pipe(
      tap((resp: any) => {
        this._user.next(resp.user);
      }),
      map(() => void 0),
      catchError(() => {
        // Backend caído o 401 → limpiar token y continuar sin romper la app
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('encrypt');
        }
        this._user.next(null);
        return of(void 0);
      }),
    );
}

  /**
   * Update user info
   */
  update(user: User): Observable<any> {
    return this._httpClient.patch(`${this.apiUrl}dash/user`, user).pipe(
      tap((resp: any) => {
        this._user.next(resp.user);
      }),
    );
  }

  /**
   * Update user status (online / away / etc)
   */
  updateUserStatus(status: string): void {
    this._httpClient.post(`${this.apiUrl}dash/update-status`, { status }).subscribe({
      next: (resp: any) => {
        this._user.next(resp.user);
      },
      error: (err) => {
        console.error('[UserService] Error al actualizar status:', err);
      },
    });
  }

  openProfileDrawer(): void {
    this._openProfileDrawer.next();
  }

  /**
   * Actualiza el usuario haciendo merge con los datos existentes
   * SOLUCIÓN: Preserva todas las propiedades del usuario actual
   */
  updateUser(data: any): void {
    this._user.pipe(take(1)).subscribe((currentUser) => {
      if (!currentUser) {
        return;
      }

      const normalized = this.normalizeUser(data);

      const mergedUser: User = {
        ...currentUser,
        ...normalized,
      };

      this._user.next(mergedUser);
    });
  }

  /**
   * Normaliza los datos del usuario que vienen del backend
   * 🔥 CORRECCIÓN: Simplificar normalización
   */
  normalizeUser(apiUser: any): Partial<User> {

    if (apiUser.email && apiUser.name) {
      return apiUser;
    }
    const normalized: any = {};
    if (apiUser.ID !== undefined || apiUser.id !== undefined) {
      normalized.id = apiUser.ID ?? apiUser.id;
    }
    if (apiUser.NOMBRE !== undefined || apiUser.name !== undefined) {
      normalized.name = apiUser.NOMBRE ?? apiUser.name;
    }
    if (apiUser.CORREO !== undefined || apiUser.email !== undefined) {
      normalized.email = apiUser.CORREO ?? apiUser.email;
    }
    if (apiUser.USUARIO !== undefined || apiUser.usuario !== undefined) {
      normalized.usuario = apiUser.USUARIO ?? apiUser.usuario;
    }
    if (apiUser.PHOTO !== undefined || apiUser.photo !== undefined) {
      normalized.photo = apiUser.PHOTO ?? apiUser.photo;
    }
    if (apiUser.DEPARTAMENTO !== undefined || apiUser.departamento !== undefined) {
      normalized.departamento = apiUser.DEPARTAMENTO ?? apiUser.departamento;
    }
    if (apiUser.permissions !== undefined) {
      normalized.permissions = apiUser.permissions;
    }
    if (apiUser.identity_id !== undefined) {
      normalized.identity_id = apiUser.identity_id;
    }
    if (apiUser.identityId !== undefined) {
      normalized.identity_id = apiUser.identityId;
    }

    // ─── AGREGAR ESTO ───────────────────────
  if (apiUser.workout !== undefined) {
    normalized.workout = apiUser.workout;
  }
  if (apiUser.access_sessions !== undefined) {
    normalized.access_sessions = apiUser.access_sessions;
  }
  if (apiUser.membership !== undefined) {
    normalized.membership = apiUser.membership;
  }
  if (apiUser.qr !== undefined) {
    normalized.qr = apiUser.qr;
  }
  if (apiUser.biometrics !== undefined) {
    normalized.biometrics = apiUser.biometrics;
  }
  if (apiUser.last_access !== undefined) {
    normalized.last_access = apiUser.last_access;
  }
  if (apiUser.gym !== undefined) {
    normalized.gym = apiUser.gym;
  }

  return normalized;
  }
}
