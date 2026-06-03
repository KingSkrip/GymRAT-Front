import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;

  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}gestion/roles`);
  }
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}gestion/users`);
  }
}
