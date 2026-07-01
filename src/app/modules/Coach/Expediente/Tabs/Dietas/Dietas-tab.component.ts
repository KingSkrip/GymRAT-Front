// Dietas-tab.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
  Input,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GestionUser } from '../../../../Suadmin/Gestion/gestion.service';
import { Diet, DietPayload, ExpedienteService, Meal } from '../../expediente.service';
import { LoaderComponent } from '../../../../../layout/layouts/loader/loader.component';

// ── Modales separados ─────────────────────────────────────────────────────
// Ajusta estas 4 rutas si tu carpeta real de modales es distinta.
import { DietaFormModalComponent, DietaFormModel } from '../../../../modals/Expediente/Dietas/Create/dieta-form-modal.component';
import { DietaShowModalComponent } from '../../../../modals/Expediente/Dietas/Show/dieta-show-modal.component';
import { DietaToggleModalComponent } from '../../../../modals/Expediente/Dietas/Lock/dieta-toggle-modal.component';
import { DietaDeleteModalComponent } from '../../../../modals/Expediente/Dietas/Delete/dieta-delete-modal.component';

@Component({
  selector: 'coach-dietas-tab',
  standalone: true,
  templateUrl: './Dietas-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    LoaderComponent,
    DietaFormModalComponent,
    DietaShowModalComponent,
    DietaToggleModalComponent,
    DietaDeleteModalComponent,
  ],
})
export class DietasTabComponent implements OnInit, OnChanges {
  private svc = inject(ExpedienteService);
  private cdr = inject(ChangeDetectorRef);
  @Input({ required: true })
  alumno!: GestionUser;
  loading = false;

  // ── Datos ─────────────────────────────────────────────────────────────────
  dietas: Diet[] = [];

  // ── Modal Crear/Editar ───────────────────────────────────────────────────
  showDietaModal = false;
  editingDieta: Diet | null = null;
  dietaForm: DietaFormModel = this.emptyDieta();

  // ── Modal Ver detalle ────────────────────────────────────────────────────
  showShowModal = false;
  viewingDieta: Diet | null = null;

  // ── Modal Activar/Desactivar ─────────────────────────────────────────────
  toggleTarget: Diet | null = null;

  // ── Modal Eliminar ───────────────────────────────────────────────────────
  deleteTarget: Diet | null = null;

  // ── Estado compartido de guardado para toggle/delete ────────────────────
  savingConfirm = false;

  ngOnInit() {}

  ngOnChanges() {
    if (this.alumno?.id) {
      this.loadDietas(this.alumno.id);
    }
  }
  // ── Loaders ───────────────────────────────────────────────────────────────
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

  saveDieta(form: DietaFormModel) {
    const payload = {
      ...form,
      coach_id: 0, // reemplaza con el id del coach autenticado
      user_id: this.alumno.id,
    } as DietPayload;
    const obs = this.editingDieta
      ? this.svc.updateDieta(this.editingDieta.id, payload)
      : this.svc.storeDieta(payload);
    obs.subscribe({
      next: () => {
        this.closeDietaModal();
        this.loadDietas(this.alumno.id);
      },
    });
  }

  duplicateDieta(id: number) {
    this.svc.duplicateDieta(id).subscribe({ next: () => this.loadDietas(this.alumno.id) });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyDieta(): DietaFormModel {
    return {
      title: '',
      description: '',
      is_active: true,
      starts_at: '',
      ends_at: '',
      meals: [] as Partial<Meal>[],
    };
  }

  // ── Modal Ver detalle ────────────────────────────────────────────────────

  openShowModal(d: Diet) {
    this.viewingDieta = d;
    this.showShowModal = true;
  }

  closeShowModal() {
    this.showShowModal = false;
    this.viewingDieta = null;
  }

  /** Desde el modal Show: pasa a edición */
  onShowEdit(d: Diet) {
    this.closeShowModal();
    this.openDietaModal(d);
  }

  /** Desde el modal Show: pide confirmación de toggle */
  onShowToggle(d: Diet) {
    this.closeShowModal();
    this.openConfirmToggle(d);
  }

  /** Desde el modal Show: pide confirmación de delete */
  onShowDelete(d: Diet) {
    this.closeShowModal();
    this.openConfirmDelete(d);
  }

  // ── Confirmación Toggle ──────────────────────────────────────────────────

  openConfirmToggle(item: Diet) {
    this.toggleTarget = item;
  }

  closeToggleModal() {
    if (this.savingConfirm) return;
    this.toggleTarget = null;
  }

  confirmToggle(item: Diet) {
    this.savingConfirm = true;
    this.svc.toggleDieta(item.id).subscribe({
      next: () => {
        this.savingConfirm = false;
        this.toggleTarget = null;
        this.loadDietas(this.alumno.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingConfirm = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Confirmación Delete ──────────────────────────────────────────────────

  openConfirmDelete(item: Diet) {
    this.deleteTarget = item;
  }

  closeDeleteModal() {
    if (this.savingConfirm) return;
    this.deleteTarget = null;
  }

  confirmDelete(item: Diet) {
    this.savingConfirm = true;
    this.svc.deleteDieta(item.id).subscribe({
      next: () => {
        this.savingConfirm = false;
        this.deleteTarget = null;
        this.loadDietas(this.alumno.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingConfirm = false;
        this.cdr.markForCheck();
      },
    });
  }
}