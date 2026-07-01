// Rutinas-tab.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  ExpedienteService,
  Workout,
  WorkoutGoal,
  WorkoutLevel,
  WorkoutPayload,
} from '../../expediente.service';
import { GestionUser } from '../../../../Suadmin/Gestion/gestion.service';
import { LoaderComponent } from '../../../../../layout/layouts/loader/loader.component';

// ── Modales separados ─────────────────────────────────────────────────────
// Ajusta estas 4 rutas si tu carpeta real de modales es distinta.
import { RutinaFormModalComponent } from '../../../../modals/Expediente/Rutinas/Create/rutina-form-modal.component';
import { RutinaShowModalComponent } from '../../../../modals/Expediente/Rutinas/Show/rutina-show-modal.component';
import { RutinaToggleModalComponent } from '../../../../modals/Expediente/Rutinas/Lock/rutina-toggle-modal.component';
import { RutinaDeleteModalComponent } from '../../../../modals/Expediente/Rutinas/Delete/rutina-delete-modal.component';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../../core/user/user.types';

@Component({
  selector: 'coach-rutinas-tab',
  standalone: true,
  templateUrl: './Rutinas-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    LoaderComponent,
    RutinaFormModalComponent,
    RutinaShowModalComponent,
    RutinaToggleModalComponent,
    RutinaDeleteModalComponent,
  ],
})
export class RutinasTabComponent implements OnInit, OnChanges {
  private svc = inject(ExpedienteService);
  private cdr = inject(ChangeDetectorRef);
  loading = false;
  private auth = inject(AuthService);
  @Input({ required: true })
  alumno!: GestionUser;

  // ── Datos ─────────────────────────────────────────────────────────────────
  rutinas: Workout[] = [];

  // ── Modal Crear/Editar ───────────────────────────────────────────────────
  showRutinaModal = false;
  editingRutina: Workout | null = null;
  rutinaForm: Partial<WorkoutPayload> = this.emptyRutina();

  // ── Modal Ver detalle ────────────────────────────────────────────────────
  showShowModal = false;
  viewingRutina: Workout | null = null;

  // ── Modal Activar/Desactivar ─────────────────────────────────────────────
  toggleTarget: Workout | null = null;

  // ── Modal Eliminar ───────────────────────────────────────────────────────
  deleteTarget: Workout | null = null;

  // ── Estado compartido de guardado para toggle/delete ────────────────────
  savingConfirm = false;

  goalLabel: Record<WorkoutGoal, string> = {
    Fuerza: 'Fuerza',
    Hipertrofia: 'Hipertrofia',
    'Pérdida de grasa': 'Pérdida de grasa',
    'Acondicionamiento físico': 'Acondicionamiento',
    Rehabilitación: 'Rehabilitación',
    Personalizado: 'Personalizado',
  };

  levelLabel: Record<WorkoutLevel, string> = {
    Principiante: 'Principiante',
    Intermedio: 'Intermedio',
    Avanzado: 'Avanzado',
  };

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['alumno'] && this.alumno?.id) {
      this.loadRutinas(this.alumno.id);
    }
  }

  // ── Loaders ───────────────────────────────────────────────────────────────
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

  // ── Rutinas CRUD ──────────────────────────────────────────────────────────

  openRutinaModal(r?: Workout) {
    this.editingRutina = r ?? null;
    this.rutinaForm = r
      ? {
          title: r.title,
          description: r.description ?? '',
          goal: r.goal,
          level: r.level,
          days_per_week: r.days_per_week ?? undefined,
          estimated_duration: r.estimated_duration ?? undefined,
          is_active: r.is_active,
          starts_at: r.starts_at ?? '',
          ends_at: r.ends_at ?? '',
          // clonamos para no mutar el objeto que sigue en `this.rutinas`
          // si el coach cancela sin guardar
          days: structuredClone(r.days ?? []),
        }
      : this.emptyRutina();
    this.showRutinaModal = true;
  }

  closeRutinaModal() {
    this.showRutinaModal = false;
  }

saveRutina(form: Partial<WorkoutPayload>) {
  const rawId = this.auth.getUser()?.id;
  const coachId = rawId ? Number(rawId) : undefined;

  if (!coachId || Number.isNaN(coachId)) {
    console.error('No se pudo determinar el coach autenticado.');
    return;
  }

  const payload = {
    ...form,
    coach_id: coachId,
    user_id: this.alumno.id,
  } as WorkoutPayload;

  const obs = this.editingRutina
    ? this.svc.updateRutina(this.editingRutina.id, payload)
    : this.svc.storeRutina(payload);

  obs.subscribe({
    next: () => {
      this.closeRutinaModal();
      this.loadRutinas(this.alumno.id);
    },
    error: (err) => {
      console.error('Error guardando rutina', err);
    },
  });
}

  duplicateRutina(id: number) {
    this.svc.duplicateRutina(id).subscribe({ next: () => this.loadRutinas(this.alumno.id) });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyRutina(): Partial<WorkoutPayload> {
    return {
      title: '',
      description: '',
      goal: 'Personalizado',
      level: 'Principiante',
      days_per_week: 3,
      is_active: true,
      days: [],
    };
  }
  // ── Modal Ver detalle ────────────────────────────────────────────────────

  openShowModal(r: Workout) {
    this.viewingRutina = r;
    this.showShowModal = true;
  }

  closeShowModal() {
    this.showShowModal = false;
    this.viewingRutina = null;
  }

  /** Desde el modal Show: pasa a edición */
  onShowEdit(r: Workout) {
    this.closeShowModal();
    this.openRutinaModal(r);
  }

  /** Desde el modal Show: pide confirmación de toggle */
  onShowToggle(r: Workout) {
    this.closeShowModal();
    this.openConfirmToggle(r);
  }

  /** Desde el modal Show: pide confirmación de delete */
  onShowDelete(r: Workout) {
    this.closeShowModal();
    this.openConfirmDelete(r);
  }

  // ── Confirmación Toggle ──────────────────────────────────────────────────

  openConfirmToggle(item: Workout) {
    this.toggleTarget = item;
  }

  closeToggleModal() {
    if (this.savingConfirm) return;
    this.toggleTarget = null;
  }

  confirmToggle(item: Workout) {
    this.savingConfirm = true;
    this.svc.toggleRutina(item.id).subscribe({
      next: () => {
        this.savingConfirm = false;
        this.toggleTarget = null;
        this.loadRutinas(this.alumno.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingConfirm = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Confirmación Delete ──────────────────────────────────────────────────

  openConfirmDelete(item: Workout) {
    this.deleteTarget = item;
  }

  closeDeleteModal() {
    if (this.savingConfirm) return;
    this.deleteTarget = null;
  }

  confirmDelete(item: Workout) {
    this.savingConfirm = true;
    this.svc.deleteRutina(item.id).subscribe({
      next: () => {
        this.savingConfirm = false;
        this.deleteTarget = null;
        this.loadRutinas(this.alumno.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingConfirm = false;
        this.cdr.markForCheck();
      },
    });
  }
}
