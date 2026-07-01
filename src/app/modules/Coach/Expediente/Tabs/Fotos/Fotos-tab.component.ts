// Fotos-tab.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Assessment, ExpedienteService, ProgressPhoto } from '../../expediente.service';
import { GestionUser } from '../../../../Suadmin/Gestion/gestion.service';
import { LoaderComponent } from '../../../../../layout/layouts/loader/loader.component';
import { FotoUploadModalComponent } from '../../../../modals/Expediente/Fotos/Up/foto-upload-modal.component';
import { FotoViewerModalComponent } from '../../../../modals/Expediente/Fotos/View/foto-viewer-modal.component';
import { FotoDeleteModalComponent } from '../../../../modals/Expediente/Fotos/Delete/foto-delete-modal.component';


type PhotoKey = 'front' | 'back' | 'left_side' | 'right_side';

@Component({
  selector: 'coach-fotos-tab',
  standalone: true,
  templateUrl: './Fotos-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    LoaderComponent,
    FotoUploadModalComponent,
    FotoViewerModalComponent,
    FotoDeleteModalComponent,
  ],
})
export class FotosTabComponent implements OnInit {
  private svc = inject(ExpedienteService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true })
  alumno!: GestionUser;
  loading = false;

  // ── Datos ─────────────────────────────────────────────────────────────────
  historial: Assessment[] = [];

  photoPositions: { key: PhotoKey; label: string }[] = [
    { key: 'front', label: 'Frente' },
    { key: 'back', label: 'Espalda' },
    { key: 'left_side', label: 'Lado izq.' },
    { key: 'right_side', label: 'Lado der.' },
  ];

  // ── Modal: subir / reemplazar foto ───────────────────────────────────────
  uploadModalOpen = false;
  uploadAssessmentId: number | null = null;
  uploadPhotoKey: PhotoKey | null = null;
  uploadPhotoLabel = '';
  uploadCurrentUrl: string | null = null;

  // ── Modal: viewer (lightbox) ─────────────────────────────────────────────
  viewerOpen = false;
  viewerAssessment: Assessment | null = null;
  viewerActiveKey: PhotoKey = 'front';

  // ── Modal: eliminar foto ─────────────────────────────────────────────────
  deleteModalOpen = false;
  deleteAssessmentId: number | null = null;
  deletePhotoKey: PhotoKey | null = null;
  deletePhotoLabel = '';

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

  // ── Helpers ───────────────────────────────────────────────────────────────

  getPhoto(a: Assessment, key: PhotoKey): string | null {
    return a.photos?.[key] ?? null;
  }

  getLabel(key: PhotoKey): string {
    return this.photoPositions.find((p) => p.key === key)?.label ?? '';
  }

  private findAssessment(id: number): Assessment | null {
    return this.historial.find((a) => a.id === id) ?? null;
  }

  // ── Viewer (lightbox) ─────────────────────────────────────────────────────

  openViewer(a: Assessment, key: PhotoKey) {
    this.viewerAssessment = a;
    this.viewerActiveKey = key;
    this.viewerOpen = true;
  }

  closeViewer() {
    this.viewerOpen = false;
  }

  onViewerKeyChange(key: PhotoKey) {
    this.viewerActiveKey = key;
  }

  onViewerEditRequested(key: PhotoKey) {
    if (!this.viewerAssessment) return;
    this.viewerOpen = false;
    this.openUploadModal(this.viewerAssessment, key);
  }

  onViewerDeleteRequested(key: PhotoKey) {
    if (!this.viewerAssessment) return;
    this.viewerOpen = false;
    this.openDeleteModal(this.viewerAssessment, key);
  }

  // ── Subir / reemplazar foto ──────────────────────────────────────────────

  openUploadModal(a: Assessment, key: PhotoKey) {
    this.uploadAssessmentId = a.id;
    this.uploadPhotoKey = key;
    this.uploadPhotoLabel = this.getLabel(key);
    this.uploadCurrentUrl = this.getPhoto(a, key);
    this.uploadModalOpen = true;
  }

  closeUploadModal() {
    this.uploadModalOpen = false;
  }

  onPhotoUploaded(event: { assessmentId: number; photoKey: PhotoKey; data: ProgressPhoto }) {
    this.uploadModalOpen = false;
    this.loadHistorial(this.alumno.id);

    // Si el viewer venía abierto sobre esta evaluación, refresca su referencia
    if (this.viewerAssessment?.id === event.assessmentId) {
      const refreshed = this.findAssessment(event.assessmentId);
      if (refreshed) this.viewerAssessment = refreshed;
    }
  }

  // ── Eliminar foto ─────────────────────────────────────────────────────────

  openDeleteModal(a: Assessment, key: PhotoKey) {
    this.deleteAssessmentId = a.id;
    this.deletePhotoKey = key;
    this.deletePhotoLabel = this.getLabel(key);
    this.deleteModalOpen = true;
  }

  closeDeleteModal() {
    this.deleteModalOpen = false;
  }

  onPhotoDeleted(event: { assessmentId: number; photoKey: PhotoKey }) {
    this.deleteModalOpen = false;
    this.loadHistorial(this.alumno.id);

    if (this.viewerAssessment?.id === event.assessmentId) {
      const refreshed = this.findAssessment(event.assessmentId);
      if (refreshed) this.viewerAssessment = refreshed;
    }
  }
}