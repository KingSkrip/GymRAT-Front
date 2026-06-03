// gyms.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';

export interface GymItem {
  id: number;
  name: string;
  sub?: string;
  badge?: string;
  badgeColor?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}

export interface GymsResponse {
  total: number;
  items: GymItem[];
}



  export interface GymBranch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export interface GymItem {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  sub?: string;
  badge?: string;
  badgeColor?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  branches: GymBranch[];
}



@Injectable({ providedIn: 'root' })
export class GymsService {
  private http   = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;

  getGyms(): Observable<GymsResponse> {
    return this.http.get<GymsResponse>(`${this.apiUrl}gestion/gyms`);
  }

// Agrega en el service:
storeBranch(gymId: number, data: Partial<GymBranch>): Observable<GymBranch> {
  return this.http.post<GymBranch>(`${this.apiUrl}gestion/gyms/${gymId}/branches`, data);
}

updateBranch(gymId: number, branchId: number, data: Partial<GymBranch>): Observable<GymBranch> {
  return this.http.put<GymBranch>(`${this.apiUrl}gestion/gyms/${gymId}/branches/${branchId}`, data);
}
}