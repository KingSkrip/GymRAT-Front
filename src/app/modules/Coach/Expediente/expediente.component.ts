// expediente.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  ExpedienteService,
  Diet,
  DietPayload,
  Workout,
  WorkoutPayload,
  Assessment,
  ProgressSummary,
  ProgressCharts,
  Meal,
  AssessmentPayload,
} from './expediente.service';
import { GestionUser } from '../../Suadmin/Gestion/users.types';
import { RolesService } from '../../Suadmin/Gestion/gestion.service';
import { LoaderComponent } from '../../../layout/layouts/loader/loader.component';
import { DietasTabComponent } from './Tabs/Dietas/Dietas-tab.component';
import { RutinasTabComponent } from './Tabs/Rutinas/Rutinas-tab.component';
import { EvaluacionesTabComponent } from './Tabs/Evaluaciones/Evaluaciones-tab.component';
import { FotosTabComponent } from './Tabs/Fotos/Fotos-tab.component';
import { ResumenTabComponent } from './Tabs/Resumen/Resumen-tab.component';


type Tab = 'resumen' | 'rutinas' | 'dietas' | 'evaluaciones' | 'fotos';
type PhotoKey = 'front' | 'back' | 'left_side' | 'right_side';

@Component({
  selector: 'coach-expediente',
  standalone: true,
  templateUrl: './expediente.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, LoaderComponent, DietasTabComponent, RutinasTabComponent, EvaluacionesTabComponent, FotosTabComponent, ResumenTabComponent],
})
export class ExpedienteComponent implements OnInit {
  private svc = inject(ExpedienteService);
  private rolesSvc = inject(RolesService);
  private cdr = inject(ChangeDetectorRef);

  // ── Lista alumnos ─────────────────────────────────────────────────────────
  alumnos: GestionUser[] = [];
  alumnosFiltrados: GestionUser[] = [];
  searchQuery = '';
  loadingAlumnos = false;

  // ── Alumno seleccionado ───────────────────────────────────────────────────
  alumnoActivo: GestionUser | null = null;
  showExpediente = false;
  editingEvaluacion: Assessment | null = null;

  // ── Tabs del expediente ───────────────────────────────────────────────────
  activeTab: Tab = 'resumen';
  loading = false;

  // ── Datos ─────────────────────────────────────────────────────────────────
  dietas: Diet[] = [];
  rutinas: Workout[] = [];
  historial: Assessment[] = [];
  summary: ProgressSummary | null = null;
  charts: ProgressCharts | null = null;
  showEvaluacionModal = false;

  // ── Modals ────────────────────────────────────────────────────────────────
  showDietaModal = false;
  showRutinaModal = false;
  editingDieta: Diet | null = null;
  editingRutina: Workout | null = null;

  dietaForm: Partial<DietPayload> & { meals: Partial<Meal>[] } = this.emptyDieta();


  photoPositions: { key: PhotoKey; label: string }[] = [
    { key: 'front', label: 'Frente' },
    { key: 'back', label: 'Espalda' },
    { key: 'left_side', label: 'Lado izq.' },
    { key: 'right_side', label: 'Lado der.' },
  ];

  tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'resumen', label: 'Resumen', icon: 'dashboard' },
    { key: 'rutinas', label: 'Rutinas', icon: 'fitness_center' },
    { key: 'dietas', label: 'Dietas', icon: 'restaurant_menu' },
    { key: 'evaluaciones', label: 'Evaluaciones', icon: 'monitor_weight' },
    { key: 'fotos', label: 'Fotos', icon: 'photo_camera' },
  ];

  goalLabel: Record<string, string> = {
    strength: 'Fuerza',
    hypertrophy: 'Hipertrofia',
    fat_loss: 'Pérdida de grasa',
    conditioning: 'Acondicionamiento',
    rehabilitation: 'Rehabilitación',
    custom: 'Personalizado',
  };

  levelLabel: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };

  // ── Modal de confirmación (delete/toggle) ───────────────────────────────────
  confirmModal: {
    action: 'delete' | 'toggle';
    target: 'dieta' | 'rutina' | 'evaluacion' | 'foto';
    id: number;
    label: string;
    isActive?: boolean;
    photoKey?: PhotoKey;
  } | null = null;
  savingConfirm = false;

  uploadingPhoto: string | null = null;

  ngOnInit() {
    this.loadAlumnos();
  }

  // ── Alumnos ───────────────────────────────────────────────────────────────

  loadAlumnos() {
    this.loadingAlumnos = true;
    this.rolesSvc.getUsers().subscribe({
      next: (r: any) => {
        const grupos: { gym: any; users: GestionUser[] }[] = r.clients ?? [];
        this.alumnos = grupos.flatMap((g) => g.users ?? []);
        this.alumnosFiltrados = [...this.alumnos];
        this.loadingAlumnos = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingAlumnos = false;
        this.cdr.markForCheck();
      },
    });
  }

  filtrarAlumnos() {
    const q = this.searchQuery.toLowerCase().trim();
    this.alumnosFiltrados = q
      ? this.alumnos.filter(
          (a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q),
        )
      : [...this.alumnos];
    this.cdr.markForCheck();
  }

  abrirExpediente(alumno: GestionUser) {
    this.alumnoActivo = alumno;
    this.showExpediente = true;
    this.activeTab = 'resumen';
    this.loadTab('resumen');
  }

  cerrarExpediente() {
    this.showExpediente = false;
    this.alumnoActivo = null;
    this.dietas = [];
    this.rutinas = [];
    this.historial = [];
    this.summary = null;
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  setTab(tab: Tab) {
    this.activeTab = tab;
    this.loadTab(tab);
  }

  private loadTab(tab: Tab) {
    const uid = this.alumnoActivo?.id;
    if (!uid) return;
    switch (tab) {
      case 'resumen':
        this.loadSummary(uid);
        break;
      case 'rutinas':
        this.loadRutinas(uid);
        break;
      case 'dietas':
        this.loadDietas(uid);
        break;
      case 'evaluaciones':
        this.loadHistorial(uid);
        break;
      case 'fotos':
        this.loadHistorial(uid);
        break;
    }
  }

  // ── Loaders ───────────────────────────────────────────────────────────────

  private loadSummary(uid: number) {
    this.loading = true;
    this.svc.getSummary(uid).subscribe({
      next: (r) => {
        this.summary = r.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
    this.svc.getCharts(uid).subscribe({
      next: (r) => {
        this.charts = r.data;
        this.cdr.markForCheck();
      },
    });
  }

  private loadDietas(uid: number) {
    this.loading = true;
    this.svc.getDietas(uid).subscribe({
      next: (r) => {
        this.dietas = r.data.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadRutinas(uid: number) {
    this.loading = true;
    this.svc.getRutinas(uid).subscribe({
      next: (r) => {
        this.rutinas = r.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadHistorial(uid: number) {
    this.loading = true;
    this.svc.getHistorial(uid).subscribe({
      next: (r) => {
        this.historial = r.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Dietas CRUD ───────────────────────────────────────────────────────────

  openDietaModal(d?: Diet) {
    this.editingDieta = d ?? null;
    this.dietaForm = d
      ? {
          title: d.title,
          description: d.description ?? '',
          is_active: d.is_active,
          starts_at: d.starts_at ?? '',
          ends_at: d.ends_at ?? '',
          meals: d.meals.map((m) => ({ ...m })),
        }
      : this.emptyDieta();
    this.showDietaModal = true;
  }

  closeDietaModal() {
    this.showDietaModal = false;
  }

  addMeal() {
    this.dietaForm.meals!.push({
      meal: '',
      food: '',
      quantity: 0,
      unit: 'g',
      order: this.dietaForm.meals!.length + 1,
    });
  }

  removeMeal(i: number) {
    this.dietaForm.meals!.splice(i, 1);
  }

  saveDieta() {
    const payload = {
      ...this.dietaForm,
      coach_id: 0, // reemplaza con el id del coach autenticado
      user_id: this.alumnoActivo!.id,
    } as DietPayload;
    const obs = this.editingDieta
      ? this.svc.updateDieta(this.editingDieta.id, payload)
      : this.svc.storeDieta(payload);
    obs.subscribe({
      next: () => {
        this.closeDietaModal();
        this.loadDietas(this.alumnoActivo!.id);
      },
    });
  }

  deleteDieta(id: number) {
    if (!confirm('¿Eliminar dieta?')) return;
    this.svc.deleteDieta(id).subscribe({ next: () => this.loadDietas(this.alumnoActivo!.id) });
  }

  toggleDieta(id: number) {
    this.svc.toggleDieta(id).subscribe({ next: () => this.loadDietas(this.alumnoActivo!.id) });
  }

  duplicateDieta(id: number) {
    this.svc.duplicateDieta(id).subscribe({ next: () => this.loadDietas(this.alumnoActivo!.id) });
  }


  // ── Helpers ───────────────────────────────────────────────────────────────

  getChange(val: number | null): string {
    if (val == null) return '—';
    return (val > 0 ? '+' : '') + val.toFixed(1);
  }

  changeClass(val: number | null, invertPositive = false): string {
    if (!val) return 'text-zinc-400';
    return (invertPositive ? val < 0 : val > 0) ? 'text-emerald-500' : 'text-red-500';
  }

  getPhoto(a: Assessment, key: PhotoKey): string | null {
    return a.photos?.[key] ?? null;
  }

  private emptyDieta() {
    return {
      title: '',
      description: '',
      is_active: true,
      starts_at: '',
      ends_at: '',
      meals: [] as Partial<Meal>[],
    };
  }


  evaluacionForm: Partial<AssessmentPayload> & {
    measurements: NonNullable<AssessmentPayload['measurements']>;
    skinfolds: NonNullable<AssessmentPayload['skinfolds']>;
  } = this.emptyEvaluacion();

  private emptyEvaluacion() {
    return {
      assessment_date: new Date().toISOString().split('T')[0],
      notes: '',
      measurements: {
        neck: undefined,
        shoulders: undefined,
        chest: undefined,
        left_arm: undefined,
        right_arm: undefined,
        waist: undefined,
        abdomen: undefined,
        hip: undefined,
        left_thigh: undefined,
        right_thigh: undefined,
        left_calf: undefined,
        right_calf: undefined,
      },
      skinfolds: {
        chest: undefined,
        tricep: undefined,
        subscapular: undefined,
        midaxillary: undefined,
        suprailiac: undefined,
        abdomen: undefined,
        thigh: undefined,
        calf: undefined,
      },
    };
  }

  openEvaluacionModal(a?: Assessment) {
    this.editingEvaluacion = a ?? null;

    if (a) {
      this.evaluacionForm = {
        assessment_date: a.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        notes: '',
        weight: a.weight ?? undefined,
        height: undefined,
        body_fat: a.body_fat ?? undefined,
        muscle_mass: a.muscle_mass ?? undefined,
        water_percentage: a.water_percentage ?? undefined,
        bmi: a.bmi ?? undefined,
        visceral_fat: a.visceral_fat ?? undefined,
        metabolic_age: undefined,
        measurements: { ...(a.measurements ?? {}) },
        skinfolds: { ...(a.skinfolds ?? {}) },
      };
    } else {
      this.evaluacionForm = this.emptyEvaluacion();
    }

    this.showEvaluacionModal = true;
  }

  closeEvaluacionModal() {
    this.showEvaluacionModal = false;
    this.editingEvaluacion = null;
  }

  saveEvaluacion() {
    const uid = this.alumnoActivo!.id;

    if (this.editingEvaluacion) {
      const payload: Partial<AssessmentPayload> = { ...this.evaluacionForm, user_id: uid };
      this.svc.updateAssessment(this.editingEvaluacion.id, payload).subscribe({
        next: () => {
          this.closeEvaluacionModal();
          this.loadHistorial(uid);
          this.loadSummary(uid);
          this.cdr.markForCheck();
        },
      });
    } else {
      const payload: AssessmentPayload = { ...this.evaluacionForm, coach_id: 0, user_id: uid };
      this.svc.storeAssessment(payload).subscribe({
        next: () => {
          this.closeEvaluacionModal();
          this.loadHistorial(uid);
          this.loadSummary(uid);
          this.cdr.markForCheck();
        },
      });
    }
  }

  deleteEvaluacion(id: number) {
    if (!confirm('¿Eliminar esta evaluación? Esta acción no se puede deshacer.')) return;
    this.svc.deleteAssessment(this.alumnoActivo!.id, id).subscribe({
      next: () => {
        this.loadHistorial(this.alumnoActivo!.id);
        this.loadSummary(this.alumnoActivo!.id);
        this.cdr.markForCheck();
      },
    });
  }

  // ── Confirmación delete/toggle (dietas y rutinas) ───────────────────────────

  openConfirmDelete(target: 'dieta' | 'rutina', item: Diet | Workout) {
    this.confirmModal = { action: 'delete', target, id: item.id, label: item.title };
  }

  openConfirmToggle(target: 'dieta' | 'rutina', item: Diet | Workout) {
    this.confirmModal = {
      action: 'toggle',
      target,
      id: item.id,
      label: item.title,
      isActive: item.is_active,
    };
  }

  openConfirmDeleteEvaluacion(a: Assessment) {
    const fecha = a.created_at ? new Date(a.created_at).toLocaleDateString('es-MX') : '';
    this.confirmModal = { action: 'delete', target: 'evaluacion', id: a.id, label: fecha };
  }

  openConfirmDeleteFoto(a: Assessment, key: PhotoKey) {
    const label = this.photoPositions.find((p) => p.key === key)?.label ?? '';
    this.confirmModal = { action: 'delete', target: 'foto', id: a.id, label, photoKey: key };
  }

  closeConfirmModal() {
    if (this.savingConfirm) return;
    this.confirmModal = null;
  }

  executeConfirm() {
    if (!this.confirmModal) return;
    const { action, target, id, photoKey } = this.confirmModal;
    const uid = this.alumnoActivo!.id;

    this.savingConfirm = true;

    const finishDietas = () => {
      this.savingConfirm = false;
      this.confirmModal = null;
      this.loadDietas(uid);
      this.cdr.markForCheck();
    };
    const finishRutinas = () => {
      this.savingConfirm = false;
      this.confirmModal = null;
      this.loadRutinas(uid);
      this.cdr.markForCheck();
    };
    const finishHistorial = () => {
      this.savingConfirm = false;
      this.confirmModal = null;
      this.loadHistorial(uid);
      this.loadSummary(uid);
      this.cdr.markForCheck();
    };
    const onError = () => {
      this.savingConfirm = false;
      this.cdr.markForCheck();
    };

    if (target === 'dieta' && action === 'delete') {
      this.svc.deleteDieta(id).subscribe({ next: finishDietas, error: onError });
    } else if (target === 'dieta' && action === 'toggle') {
      this.svc.toggleDieta(id).subscribe({ next: finishDietas, error: onError });
    } else if (target === 'rutina' && action === 'delete') {
      this.svc.deleteRutina(id).subscribe({ next: finishRutinas, error: onError });
    } else if (target === 'rutina' && action === 'toggle') {
      this.svc.toggleRutina(id).subscribe({ next: finishRutinas, error: onError });
    } else if (target === 'evaluacion' && action === 'delete') {
      this.svc.deleteAssessment(uid, id).subscribe({ next: finishHistorial, error: onError });
    } else if (target === 'foto' && action === 'delete' && photoKey) {
      this.svc
        .deleteAssessmentPhoto(id, photoKey)
        .subscribe({ next: finishHistorial, error: onError });
    }
  }

  // ── Fotos: subir / reemplazar ───────────────────────────────────────────────

  onPhotoSelected(event: Event, assessment: Assessment, key: PhotoKey) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadingPhoto = `${assessment.id}-${key}`;
    this.cdr.markForCheck();

    this.svc.uploadAssessmentPhoto(assessment.id, key, file).subscribe({
      next: () => {
        this.uploadingPhoto = null;
        this.loadHistorial(this.alumnoActivo!.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploadingPhoto = null;
        this.cdr.markForCheck();
      },
    });
  }

  isUploadingPhoto(assessment: Assessment, key: PhotoKey): boolean {
    return this.uploadingPhoto === `${assessment.id}-${key}`;
  }
}
