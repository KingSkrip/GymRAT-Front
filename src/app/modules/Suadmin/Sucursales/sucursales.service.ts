import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';

// ── Interfaces ────────────────────────────────────────────────────────

export interface SucursalMetrics {
  total: number;
  active: number;
  inactive: number;
  sub_active: number;
  sub_expiring: number;
  sub_expired: number;
  no_sub: number;
}

export interface GymInfo {
  id: number;
  name: string;
  client: { id: number; name: string } | null;
}

export interface Payment {
  id: number;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_method: string | null;
  transaction_id: string | null;
  paid_at: string | null;
}

export interface Subscription {
  id: number;
  gym_branch_id: number;
  plan: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  payments: Payment[];
}

export interface Sucursal {
  id: number;
  gym_id: number;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  status_label: string;
  status_color: 'green' | 'yellow' | 'red' | 'gray';
  gym: GymInfo | null;
  current_subscription: Subscription | null;
  days_left: number | null;
  sub_status_label: string;
  sub_status_color: 'green' | 'yellow' | 'red' | 'gray';
  last_payment: Payment | null;
  created_at: string;
  subscriptions?: Subscription[];
}

export interface SucursalListResponse {
  metrics: SucursalMetrics;
  data: Sucursal[];
}

export interface SucursalResponse {
  data: Sucursal;
  message?: string;
}

export interface SucursalFilters {
  status?: 'active' | 'inactive' | '';
  sub_status?: 'sub_active' | 'sub_expiring' | 'sub_expired' | 'no_sub' | '';
  gym_id?: number;
  search?: string;
}

  export interface SucursalPayload {
  name: string;
  gym_id?: number;
  address?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}

export interface SubscriptionPayload {
  plan: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  starts_at: string;
  ends_at?: string;
  is_active?: boolean;
}

export interface PaymentPayload {
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_method?: string;
  transaction_id?: string;
  paid_at?: string;
}

export interface GymOption {
  id: number;
  name: string;
}

// ── Service ───────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;
  private base = `${this.apiUrl}gestion/sucursales`;

  getAll(filters?: SucursalFilters): Observable<SucursalListResponse> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.sub_status) params = params.set('sub_status', filters.sub_status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.gym_id) params = params.set('gym_id', String(filters.gym_id));
    return this.http.get<SucursalListResponse>(this.base, { params });
  }

  getOne(id: number): Observable<SucursalResponse> {
    return this.http.get<SucursalResponse>(`${this.base}/${id}`);
  }

  update(id: number, payload: Partial<SucursalPayload>): Observable<SucursalResponse> {
    return this.http.put<SucursalResponse>(`${this.base}/${id}`, payload);
  }

// sucursales.service.ts
create(payload: SucursalPayload): Observable<SucursalResponse> {
  return this.http.post<SucursalResponse>(this.base, payload);
}

  toggle(id: number): Observable<{ message: string; is_active: boolean }> {
    return this.http.patch<{ message: string; is_active: boolean }>(
      `${this.base}/${id}/toggle`,
      {},
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  // ── Subscriptions ─────────────────────────────────────────────────

  storeSubscription(
    branchId: number,
    payload: SubscriptionPayload,
  ): Observable<{ message: string; data: Subscription }> {
    return this.http.post<{ message: string; data: Subscription }>(
      `${this.base}/${branchId}/subscriptions`,
      payload,
    );
  }

  updateSubscription(
    branchId: number,
    subId: number,
    payload: Partial<SubscriptionPayload>,
  ): Observable<{ message: string; data: Subscription }> {
    return this.http.put<{ message: string; data: Subscription }>(
      `${this.base}/${branchId}/subscriptions/${subId}`,
      payload,
    );
  }

  // ── Payments ──────────────────────────────────────────────────────

  storePayment(
    branchId: number,
    subId: number,
    payload: PaymentPayload,
  ): Observable<{ message: string; data: Payment }> {
    return this.http.post<{ message: string; data: Payment }>(
      `${this.base}/${branchId}/subscriptions/${subId}/payments`,
      payload,
    );
  }

  // ── Gyms list para filtro ─────────────────────────────────────────

  getGymsList(): Observable<{ data: GymOption[] }> {
    return this.http.get<{ data: GymOption[] }>(`${this.apiUrl}gestion/gyms-list`);
  }
}
