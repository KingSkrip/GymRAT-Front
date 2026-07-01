import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { Role } from './role.types';
import { SubRole } from './subroles.types';
import { GestionUser, UsersResponse } from './users.types';
export type { ClientGymGroup } from './users.types';
export type { GestionUser, UsersResponse } from './users.types';



@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;
  masterPassword = '';
  // =========================
  // ROLES
  // =========================

  getRoles(): Observable<{ success: boolean; roles: Role[] }> {
    return this.http.get<{ success: boolean; roles: Role[] }>(`${this.apiUrl}gestion/roles`);
  }

  getRole(id: number): Observable<{ success: boolean; role: Role }> {
    return this.http.get<{ success: boolean; role: Role }>(`${this.apiUrl}gestion/roles/${id}`);
  }

  createRole(data: { name: string }): Observable<{ success: boolean; role: Role }> {
    return this.http.post<{ success: boolean; role: Role }>(`${this.apiUrl}gestion/roles`, data);
  }

  updateRole(id: number, data: { name: string }): Observable<{ success: boolean; role: Role }> {
    return this.http.put<{ success: boolean; role: Role }>(
      `${this.apiUrl}gestion/roles/${id}`,
      data,
    );
  }

  deleteRole(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}gestion/roles/${id}`);
  }

  // =========================
  // SUB ROLES
  // =========================
  getSubRoles(): Observable<{ success: boolean; sub_roles: SubRole[] }> {
    return this.http.get<{ success: boolean; sub_roles: SubRole[] }>(
      `${this.apiUrl}gestion/sub-roles`,
    );
  }

  createSubRole(data: {
    name: string;
    description: string;
  }): Observable<{ success: boolean; sub_role: SubRole }> {
    return this.http.post<{ success: boolean; sub_role: SubRole }>(
      `${this.apiUrl}gestion/sub-roles`,
      {
        ...data,
        master_password: this.masterPassword,
      },
    );
  }

  getSubRole(id: number): Observable<{ success: boolean; sub_role: SubRole }> {
    return this.http.get<{ success: boolean; sub_role: SubRole }>(
      `${this.apiUrl}gestion/sub-roles/${id}`,
    );
  }

  updateSubRole(
    id: number,
    data: { name: string; description: string },
  ): Observable<{ success: boolean; sub_role: SubRole }> {
    return this.http.put<{ success: boolean; sub_role: SubRole }>(
      `${this.apiUrl}gestion/sub-roles/${id}`,
      {
        ...data,
        master_password: this.masterPassword,
      },
    );
  }

  deleteSubRole(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}gestion/sub-roles/${id}`);
  }

  // =========================
  // Usuarios
  // =========================

  getUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}gestion/users`);
  }

  getUser(id: number): Observable<{ success: boolean; user: GestionUser }> {
    return this.http.get<{ success: boolean; user: GestionUser }>(
      `${this.apiUrl}gestion/users/${id}`,
    );
  }

  createUser(data: any): Observable<{ success: boolean; user: GestionUser }> {
    return this.http.post<{ success: boolean; user: GestionUser }>(`${this.apiUrl}gestion/users`, {
      ...data,
      master_password: this.masterPassword,
    });
  }

  updateUser(id: number, data: any): Observable<{ success: boolean; user: GestionUser }> {
    return this.http.put<{ success: boolean; user: GestionUser }>(
      `${this.apiUrl}gestion/users/${id}`,
      { ...data, master_password: this.masterPassword },
    );
  }

  deleteUser(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}gestion/users/${id}`, {
      body: { master_password: this.masterPassword },
    });
  }
}
