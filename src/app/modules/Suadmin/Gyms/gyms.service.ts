import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';

// ── Interfaces ────────────────────────────────────────────────────────

export interface GymMetrics {
  total: number;
  active: number;
  inactive: number;
  total_branches: number;
}

export interface GymBranch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export interface GymClient {
  id: number;
  name: string;
  email: string;
}

export interface Gym {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  branch_count: number;
  status_label: string;
  status_color: 'green' | 'gray';
  created_at: string;
  system_client_id: number;
  client: GymClient | null;
  branches?: GymBranch[];
  // Legacy compat (used by existing gyms.component)
  sub?: string;
  badge?: string;
  badgeColor?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}

export interface GymListResponse {
  metrics: GymMetrics;
  data: Gym[];
}

export interface GymResponse {
  data: Gym;
  message?: string;
}

export interface GymFilters {
  status?: 'active' | 'inactive' | '';
  search?: string;
  client_id?: number;
}

export interface GymPayload {
  name: string;
  system_client_id: number;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export interface ClientOption {
  id: number;
  name: string;
  email: string;
}

// ── Service ───────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class GymsService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;
  private base = `${this.apiUrl}gestion/gyms`;

  getAll(filters?: GymFilters): Observable<GymListResponse> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.client_id) params = params.set('client_id', String(filters.client_id));
    return this.http.get<GymListResponse>(this.base, { params });
  }

  getOne(id: number): Observable<GymResponse> {
    return this.http.get<GymResponse>(`${this.base}/${id}`);
  }

  create(payload: GymPayload): Observable<GymResponse> {
    return this.http.post<GymResponse>(this.base, payload);
  }

  update(id: number, payload: Partial<GymPayload>): Observable<GymResponse> {
    return this.http.put<GymResponse>(`${this.base}/${id}`, payload);
  }

 // gyms.service.ts
toggle(id: number): Observable<{ message: string; is_active: boolean }> {
  return this.http.patch<{ message: string; is_active: boolean }>(
    `${this.base}/${id}/toggle`,
    {},
    { observe: 'response' }
  ).pipe(
    map(res => res.body ?? { message: 'ok', is_active: false })
  );
}

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  // ── Branches ────────────────────────────────────────────────────────

  storeBranch(gymId: number, data: Partial<GymBranch>): Observable<GymBranch> {
    return this.http.post<GymBranch>(`${this.base}/${gymId}/branches`, data);
  }

  updateBranch(gymId: number, branchId: number, data: Partial<GymBranch>): Observable<GymBranch> {
    return this.http.put<GymBranch>(`${this.base}/${gymId}/branches/${branchId}`, data);
  }

  deleteBranch(gymId: number, branchId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${gymId}/branches/${branchId}`);
  }

  // ── Clientes para el select ─────────────────────────────────────────
  getClientsList(includeId?: number): Observable<{ data: ClientOption[] }> {
    let params = new HttpParams();
    if (includeId) params = params.set('include_id', String(includeId));
    return this.http.get<{ data: ClientOption[] }>(`${this.apiUrl}gestion/clients-list`, {
      params,
    });
  }
}
