import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';

// ── Interfaces ────────────────────────────────────────────────────────

export interface ClienteMetrics {
  total: number;
  active: number;
  inactive: number;
  expiring: number;
  expired: number;
  total_gyms: number;
  total_branches: number;
}

export interface BranchSummary {
  id: number;
  name: string;
  address: string;
  is_active: boolean;
}

export interface GymSummary {
  id: number;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  branch_count: number;
  branches?: BranchSummary[];
}

export interface Cliente {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  subscription_start: string;
  subscription_end: string;
  days_left: number;
  gym_count: number;
  branch_count: number;
  status_label: string;
  status_color: 'green' | 'yellow' | 'red' | 'gray';
  created_at: string;
  gyms?: GymSummary[];
}

export interface ClienteListResponse {
  metrics: ClienteMetrics;
  data: Cliente[];
}

export interface ClienteResponse {
  data: Cliente;
  message?: string;
}

export interface ClienteToggleResponse {
  message: string;
  is_active: boolean;
}

export interface ClienteFilters {
  status?: 'active' | 'inactive' | 'expiring' | 'expired' | '';
  search?: string;
}

export interface ClientePayload {
  name: string;
  email: string;
  phone?: string;
  subscription_start: string;
  subscription_end: string;
  is_active?: boolean;
}

// ── Service ───────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;

  private base = `${this.apiUrl}clientes`;

  getAll(filters?: ClienteFilters): Observable<ClienteListResponse> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    return this.http.get<ClienteListResponse>(this.base, { params });
  }

  getOne(id: number): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.base}/${id}`);
  }

  create(payload: ClientePayload): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.base, payload);
  }

  update(id: number, payload: Partial<ClientePayload>): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.base}/${id}`, payload);
  }

  toggle(id: number): Observable<ClienteToggleResponse> {
    return this.http.patch<ClienteToggleResponse>(`${this.base}/${id}/toggle`, {});
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
