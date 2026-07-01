import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config'; // 👈 igual que gyms

type PhotoKey = 'front' | 'back' | 'left_side' | 'right_side';

// ── Interfaces ─────────────────────────────────────────────────────────────────

export interface Meal {
  id: number;
  meal?: string;
  food?: string;
  quantity?: number;
  unit?: string;
  order?: number;
}

export interface Diet {
  id: number;
  title: string;
  description: string | null;
  coach: string | null;
  client: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  meals: Meal[];
}

export interface DietPayload {
  coach_id: number;
  user_id: number;
  title: string;
  description?: string;
  is_active?: boolean;
  starts_at?: string;
  ends_at?: string;
  meals?: Omit<Meal, 'id'>[];
}

export type WorkoutGoal =
  | 'Fuerza'
  | 'Hipertrofia'
  | 'Pérdida de grasa'
  | 'Acondicionamiento físico'
  | 'Rehabilitación'
  | 'Personalizado';

export type WorkoutLevel = 'Principiante' | 'Intermedio' | 'Avanzado';

export interface WorkoutDayExercise {
  id?: number;
  exercise_id?: number | null;
  name: string;
  sets?: number | null;
  reps?: string | null;
  weight_kg?: number | null;
  duration_sec?: number | null;
  distance_m?: number | null;
  note?: string | null;
  order?: number;
  metric_type?: string; // solo uso en el front, el backend lo ignora
}

export interface WorkoutDay {
  id?: number;
  day_number: number;
  label?: string | null;
  weekdays?: number[] | null;
  notes?: string | null;
  order?: number;
  exercises: WorkoutDayExercise[];
}

export interface Workout {
  id: number;
  title: string;
  description: string | null;
  goal: WorkoutGoal;
  level: WorkoutLevel;
  coach: string | null;
  client: string | null;
  days: WorkoutDay[];
  starts_at: string | null;
  ends_at: string | null;
  days_per_week: number | null;
  estimated_duration: number | null;
  is_active: boolean;
  created_at: string;
}

export interface WorkoutPayload {
  coach_id: number;
  user_id: number;
  title: string;
  description?: string;
  goal: WorkoutGoal;
  level: WorkoutLevel;
  days_per_week?: number;
  estimated_duration?: number;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
  days: WorkoutDay[];
}

export interface Assessment {
  id: number;
  user_id: number;
  coach: { id: number; name: string } | null;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  water_percentage: number | null;
  bmi: number | null;
  visceral_fat: number | null;
  measurements: Record<string, number> | null;
  skinfolds: Record<string, number> | null;
  photos: Record<PhotoKey, string | null> | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: number;
  assessment_id: number;
  front: string | null;
  back: string | null;
  left_side: string | null;
  right_side: string | null;
}

export type ProgressPhotoMap = {
  front: string | null;
  back: string | null;
  left_side: string | null;
  right_side: string | null;
};

export interface ProgressSummary {
  current: Assessment | null;
  changes: {
    weight: number;
    body_fat: number;
    muscle_mass: number;
    water_percentage: number;
    bmi: number;
    visceral_fat: number;
  } | null;
}

export interface ChartPoint {
  date: string;
  value: number | null;
}

export interface ProgressCharts {
  weight: ChartPoint[];
  body_fat: ChartPoint[];
  muscle_mass: ChartPoint[];
  water_percentage: ChartPoint[];
  bmi: ChartPoint[];
  visceral_fat: ChartPoint[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AssessmentPayload {
  coach_id: number;
  user_id: number;
  weight?: number;
  height?: number;
  body_fat?: number;
  muscle_mass?: number;
  water_percentage?: number;
  bmi?: number;
  visceral_fat?: number;
  metabolic_age?: number;
  assessment_date?: string;
  notes?: string;
  measurements?: {
    neck?: number;
    shoulders?: number;
    chest?: number;
    left_arm?: number;
    right_arm?: number;
    waist?: number;
    abdomen?: number;
    hip?: number;
    left_thigh?: number;
    right_thigh?: number;
    left_calf?: number;
    right_calf?: number;
  };
  skinfolds?: {
    chest?: number;
    tricep?: number;
    subscapular?: number;
    midaxillary?: number;
    suprailiac?: number;
    abdomen?: number;
    thigh?: number;
    calf?: number;
  };
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ExpedienteService {
  private http = inject(HttpClient);
  private apiUrl = APP_CONFIG.apiUrl;
  private base = `${this.apiUrl}coach`;

  // ── Dietas ─────────────────────────────────────────────────────────────────

  getDietas(userId: number): Observable<ApiResponse<PaginatedResponse<Diet>>> {
    const params = new HttpParams().set('user_id', userId).set('per_page', 100);
    return this.http.get<ApiResponse<PaginatedResponse<Diet>>>(`${this.base}/dietas`, { params });
  }

  storeDieta(payload: DietPayload): Observable<ApiResponse<Diet>> {
    return this.http.post<ApiResponse<Diet>>(`${this.base}/dietas`, payload);
  }

  updateDieta(id: number, payload: Partial<DietPayload>): Observable<ApiResponse<Diet>> {
    return this.http.put<ApiResponse<Diet>>(`${this.base}/dietas/${id}`, payload);
  }

  deleteDieta(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/dietas/${id}`);
  }

  toggleDieta(id: number): Observable<ApiResponse<Diet>> {
    return this.http.patch<ApiResponse<Diet>>(`${this.base}/dietas/${id}/toggle`, {});
  }

  duplicateDieta(id: number): Observable<ApiResponse<Diet>> {
    return this.http.post<ApiResponse<Diet>>(`${this.base}/dietas/${id}/duplicate`, {});
  }

  getDietaActiva(userId: number): Observable<ApiResponse<Diet | null>> {
    return this.http.get<ApiResponse<Diet | null>>(`${this.base}/dietas/cliente/${userId}/activa`);
  }

  // ── Rutinas ────────────────────────────────────────────────────────────────

getRutinas(userId: number): Observable<PaginatedResponse<Workout>> {
  const params = new HttpParams().set('user_id', userId).set('per_page', 100);
  return this.http.get<PaginatedResponse<Workout>>(`${this.base}/rutinas`, { params });
}

storeRutina(payload: WorkoutPayload): Observable<Workout> {
  return this.http.post<Workout>(`${this.base}/rutinas`, payload);
}

updateRutina(id: number, payload: Partial<WorkoutPayload>): Observable<Workout> {
  return this.http.put<Workout>(`${this.base}/rutinas/${id}`, payload);
}

  deleteRutina(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/rutinas/${id}`);
  }

  toggleRutina(id: number): Observable<Workout> {
    return this.http.patch<Workout>(`${this.base}/rutinas/${id}/toggle`, {});
  }

  duplicateRutina(id: number): Observable<Workout> {
    return this.http.post<Workout>(`${this.base}/rutinas/${id}/duplicate`, {});
  }

  // ── Evaluaciones / Progreso ────────────────────────────────────────────────

  getHistorial(userId: number): Observable<ApiResponse<Assessment[]>> {
    return this.http.get<ApiResponse<Assessment[]>>(`${this.base}/clientes/${userId}/evaluaciones`);
  }

  getLatest(userId: number): Observable<ApiResponse<Assessment | null>> {
    return this.http.get<ApiResponse<Assessment | null>>(
      `${this.base}/clientes/${userId}/evaluaciones/ultima`,
    );
  }

  getSummary(userId: number): Observable<ApiResponse<ProgressSummary>> {
    return this.http.get<ApiResponse<ProgressSummary>>(
      `${this.base}/clientes/${userId}/progreso/resumen`,
    );
  }

  getCharts(userId: number): Observable<ApiResponse<ProgressCharts>> {
    return this.http.get<ApiResponse<ProgressCharts>>(
      `${this.base}/clientes/${userId}/progreso/graficas`,
    );
  }

  // ── Fotos ──────────────────────────────────────────────────────────────────

  getFotos(assessmentId: number): Observable<ApiResponse<ProgressPhoto | null>> {
    return this.http.get<ApiResponse<ProgressPhoto | null>>(
      `${this.base}/evaluaciones/${assessmentId}/fotos`,
    );
  }

  storeFotos(assessmentId: number, formData: FormData): Observable<ApiResponse<ProgressPhoto>> {
    return this.http.post<ApiResponse<ProgressPhoto>>(
      `${this.base}/evaluaciones/${assessmentId}/fotos`,
      formData,
    );
  }

  deleteFoto(
    assessmentId: number,
    type: 'front' | 'back' | 'left_side' | 'right_side',
  ): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.base}/evaluaciones/${assessmentId}/fotos/${type}`,
    );
  }

  storeAssessment(payload: AssessmentPayload): Observable<ApiResponse<Assessment>> {
    return this.http.post<ApiResponse<Assessment>>(
      `${this.base}/clientes/${payload.user_id}/evaluaciones`,
      payload,
    );
  }

  updateAssessment(
    assessmentId: number,
    payload: Partial<AssessmentPayload>,
  ): Observable<ApiResponse<Assessment>> {
    return this.http.put<ApiResponse<Assessment>>(
      `${this.base}/clientes/${payload.user_id}/evaluaciones/${assessmentId}`,
      payload,
    );
  }

  deleteAssessment(userId: number, assessmentId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.base}/clientes/${userId}/evaluaciones/${assessmentId}`,
    );
  }

  getAssessment(userId: number, assessmentId: number): Observable<ApiResponse<Assessment>> {
    return this.http.get<ApiResponse<Assessment>>(
      `${this.base}/clientes/${userId}/evaluaciones/${assessmentId}`,
    );
  }

  uploadAssessmentPhoto(
    assessmentId: number,
    type: 'front' | 'back' | 'left_side' | 'right_side',
    file: File,
  ): Observable<ApiResponse<ProgressPhoto>> {
    const formData = new FormData();
    formData.append(type, file);
    return this.storeFotos(assessmentId, formData);
  }

  deleteAssessmentPhoto(
    assessmentId: number,
    type: 'front' | 'back' | 'left_side' | 'right_side',
  ): Observable<ApiResponse<null>> {
    return this.deleteFoto(assessmentId, type);
  }
}
