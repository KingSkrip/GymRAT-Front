import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';

export interface GestionUser {
  id: number;
  name: string;
  email: string;
  type: string;
  is_active: boolean;
  gym: { id: number; name: string } | null;
  branch: { id: number; name: string } | null;
  role: { id: number; name: string } | null;
  sub_role: { id: number; name: string } | null;
}

export interface ClientGymGroup {
  gym: { id: number; name: string } | null;
  users: GestionUser[];
}

export interface UsersResponse {
  success: boolean;
  superadmins: GestionUser[];
  admins: GestionUser[];
  clients: ClientGymGroup[];
}

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;

  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}gestion/roles`);
  }

  getUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}gestion/users`);
  }
}