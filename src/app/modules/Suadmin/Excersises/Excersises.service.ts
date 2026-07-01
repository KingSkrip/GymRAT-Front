import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';

// ── Types ─────────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazo'
  | 'piernas'
  | 'gluteos'
  | 'pantorrillas'
  | 'abdomen'
  | 'cuerpo_completo'
  | 'cardio';

export type Equipment =
  | 'barra'
  | 'mancuernas'
  | 'maquina'
  | 'cable_polea'
  | 'peso_corporal'
  | 'kettlebell'
  | 'banda_elastica'
  | 'trx'
  | 'crossfit'
  | 'otro';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type MetricType = 'reps_weight' | 'reps_only' | 'duration' | 'distance';

export interface Exercise {
  id: number;
  name: string;
  slug: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  difficulty: Difficulty;
  metric_type: MetricType;
  description: string | null;
  video_url: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExercisePayload {
  name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  difficulty?: Difficulty;
  metric_type?: MetricType;
  description?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

export type UpdateExercisePayload = Partial<CreateExercisePayload>;

export interface ExerciseFilters {
  muscle_group?: MuscleGroup;
  equipment?: Equipment;
  difficulty?: Difficulty;
  search?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// ── Service ───────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ExcersisesService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;

  private base = `${this.apiUrl}exercises`;

  /**
   * GET /exercises
   */
  list(filters: ExerciseFilters = {}): Observable<PaginatedResponse<Exercise>> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PaginatedResponse<Exercise>>(`${this.base}/`, { params });
  }

  /**
   * GET /exercises/{id}
   */
  getById(id: number): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.base}/${id}`);
  }

  /**
   * POST /exercises
   */
  create(payload: CreateExercisePayload): Observable<Exercise> {
    return this.http.post<Exercise>(`${this.base}/`, payload);
  }

  /**
   * PUT /exercises/{id}
   */
  update(id: number, payload: UpdateExercisePayload): Observable<Exercise> {
    return this.http.put<Exercise>(`${this.base}/${id}`, payload);
  }

  /**
   * PATCH /exercises/{id}
   */
  patch(id: number, payload: UpdateExercisePayload): Observable<Exercise> {
    return this.http.patch<Exercise>(`${this.base}/${id}`, payload);
  }

  /**
   * DELETE /exercises/{id}
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * PATCH /exercises/{id}/toggle-active
   */
  toggleActive(id: number): Observable<Exercise> {
    return this.http.patch<Exercise>(`${this.base}/${id}/toggle-active`, {});
  }
}
