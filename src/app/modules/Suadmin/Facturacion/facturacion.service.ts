import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';

export interface BillingMetric {
  label: string;
  value: string;
  color: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export interface BillingItem {
  name: string;
  sub?: string;
  badge?: string;
  badgeColor?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}

export interface BillingResponse {
  metrics: BillingMetric[];
  items: BillingItem[];
}

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;

  getBilling(): Observable<BillingResponse> {
    return this.http.get<BillingResponse>(`${this.apiUrl}gestion/facturacion`);
  }
}
