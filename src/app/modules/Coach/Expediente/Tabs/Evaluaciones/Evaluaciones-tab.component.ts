// Evaluaciones-tab.component.ts
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Assessment, AssessmentPayload, ExpedienteService } from '../../expediente.service';
import { GestionUser } from '../../../../Suadmin/Gestion/gestion.service';
import { LoaderComponent } from '../../../../../layout/layouts/loader/loader.component';
import { EvaluacionFormModalComponent, EvaluacionFormModel } from '../../../../modals/Expediente/Evaluacion/Create/evaluacion-form-modal.component';
import { ConfirmDeleteModalComponent } from '../../../../modals/Expediente/Evaluacion/Delete/confirm-delete-modal.component';


type PhotoKey = 'front' | 'back' | 'left_side' | 'right_side';

@Component({
  selector: 'coach-evaluaciones-tab',
  standalone: true,
  templateUrl: './Evaluaciones-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    LoaderComponent,
    EvaluacionFormModalComponent,
    ConfirmDeleteModalComponent,
  ],
})
export class EvaluacionesTabComponent implements OnInit {
  private svc = inject(ExpedienteService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true })
  alumno!: GestionUser;

  // ── Datos ─────────────────────────────────────────────────────────────────
  historial: Assessment[] = [];
  loading = false;

  // ── Modal evaluación (create/edit) ──────────────────────────────────────
  showEvaluacionModal = false;
  editingEvaluacion: Assessment | null = null;
  savingForm = false;

  evaluacionForm: EvaluacionFormModel = this.emptyEvaluacion();

  // ── Modal confirmación (delete) ──────────────────────────────────────────
  confirmModal: {
    action: 'delete';
    target: 'evaluacion' | 'foto';
    id: number;
    label: string;
    photoKey?: PhotoKey;
  } | null = null;
  savingConfirm = false;

  ngOnInit() {
    this.loadHistorial(this.alumno.id);
  }

  // ── Loader ────────────────────────────────────────────────────────────────

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

  // ── Evaluación CRUD ──────────────────────────────────────────────────────

  private emptyEvaluacion(): EvaluacionFormModel {
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
    if (this.savingForm) return;
    this.showEvaluacionModal = false;
    this.editingEvaluacion = null;
  }

  saveEvaluacion() {
    const uid = this.alumno.id;
    this.savingForm = true;

    const onError = () => {
      this.savingForm = false;
      this.cdr.markForCheck();
    };

    if (this.editingEvaluacion) {
      const payload: Partial<AssessmentPayload> = { ...this.evaluacionForm, user_id: uid };
      this.svc.updateAssessment(this.editingEvaluacion.id, payload).subscribe({
        next: () => {
          this.savingForm = false;
          this.closeEvaluacionModal();
          this.loadHistorial(uid);
        },
        error: onError,
      });
    } else {
      const payload: AssessmentPayload = { ...this.evaluacionForm, coach_id: 0, user_id: uid };
      this.svc.storeAssessment(payload).subscribe({
        next: () => {
          this.savingForm = false;
          this.closeEvaluacionModal();
          this.loadHistorial(uid);
        },
        error: onError,
      });
    }
  }

  // ── Confirmación delete ──────────────────────────────────────────────────

  openConfirmDeleteEvaluacion(a: Assessment) {
    const fecha = a.created_at ? new Date(a.created_at).toLocaleDateString('es-MX') : '';
    this.confirmModal = { action: 'delete', target: 'evaluacion', id: a.id, label: fecha };
  }

  openConfirmDeleteFoto(a: Assessment, key: PhotoKey) {
    const label = key; // ajusta si tienes labels en este tab
    this.confirmModal = { action: 'delete', target: 'foto', id: a.id, label, photoKey: key };
  }

  closeConfirmModal() {
    if (this.savingConfirm) return;
    this.confirmModal = null;
  }

  get confirmEntityLabel(): string {
    if (!this.confirmModal) return '';
    return this.confirmModal.target === 'evaluacion' ? 'evaluación' : 'foto';
  }

  executeConfirm() {
    if (!this.confirmModal) return;
    const { target, id, photoKey } = this.confirmModal;
    const uid = this.alumno.id;

    this.savingConfirm = true;

    const finishHistorial = () => {
      this.savingConfirm = false;
      this.confirmModal = null;
      this.loadHistorial(uid);
      this.cdr.markForCheck();
    };
    const onError = () => {
      this.savingConfirm = false;
      this.cdr.markForCheck();
    };

    if (target === 'evaluacion') {
      this.svc.deleteAssessment(uid, id).subscribe({ next: finishHistorial, error: onError });
    } else if (target === 'foto' && photoKey) {
      this.svc
        .deleteAssessmentPhoto(id, photoKey)
        .subscribe({ next: finishHistorial, error: onError });
    }
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
}