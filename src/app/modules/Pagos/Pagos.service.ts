import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config';

export interface MembershipPayload {
  type: 'visit' | 'monthly' | 'yearly' | 'custom';
  price: number;
  start_date: string;
  end_date?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PagosService {
  private http = inject(HttpClient);
  private base = APP_CONFIG.apiUrl; // 👈 directo, sin inject()

  createMembership(userId: number, payload: MembershipPayload): Observable<any> {
    return this.http.post(`${this.base}users/${userId}/membership`, payload);
  }
}
