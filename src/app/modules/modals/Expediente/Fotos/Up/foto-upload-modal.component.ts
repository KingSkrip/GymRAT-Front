// foto-upload-modal.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ExpedienteService, ProgressPhoto } from '../../../../Coach/Expediente/expediente.service';


type PhotoKey = 'front' | 'back' | 'left_side' | 'right_side';

@Component({
  selector: 'coach-foto-upload-modal',
  standalone: true,
  templateUrl: './foto-upload-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
})
export class FotoUploadModalComponent implements OnChanges {
  private svc = inject(ExpedienteService);
  private cdr = inject(ChangeDetectorRef);

  // ── Inputs ────────────────────────────────────────────────────────────────
  @Input() isOpen = false;
  @Input() assessmentId: number | null = null;
  @Input() photoKey: PhotoKey | null = null;
  @Input() photoLabel = '';
  @Input() currentPhotoUrl: string | null = null;

  // ── Outputs ───────────────────────────────────────────────────────────────
  @Output() closed = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<{
    assessmentId: number;
    photoKey: PhotoKey;
    data: ProgressPhoto;
  }>();

  // ── Estado ────────────────────────────────────────────────────────────────
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploading = false;
  errorMsg: string | null = null;
  isDragging = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.resetState();
    }
  }

  private resetState() {
    this.selectedFile = null;
    this.errorMsg = null;
    this.uploading = false;
    this.isDragging = false;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  get isEditing(): boolean {
    return !!this.currentPhotoUrl;
  }

  // ── Selección de archivo ──────────────────────────────────────────────────

  onFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.setFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  private setFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.errorMsg = 'El archivo debe ser una imagen.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errorMsg = 'La imagen no debe superar los 10MB.';
      return;
    }
    this.errorMsg = null;
    this.selectedFile = file;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(file);
    this.cdr.markForCheck();
  }

  clearSelection() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.selectedFile = null;
    this.cdr.markForCheck();
  }

  // ── Subida ────────────────────────────────────────────────────────────────

  confirmUpload() {
    if (!this.selectedFile || !this.assessmentId || !this.photoKey || this.uploading) return;

    this.uploading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.svc.uploadAssessmentPhoto(this.assessmentId, this.photoKey, this.selectedFile).subscribe({
      next: (res) => {
        this.uploading = false;
        this.uploaded.emit({
          assessmentId: this.assessmentId!,
          photoKey: this.photoKey!,
          data: res.data,
        });
        this.resetState();
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploading = false;
        this.errorMsg = 'No se pudo subir la foto. Intenta de nuevo.';
        this.cdr.markForCheck();
      },
    });
  }

  close() {
    if (this.uploading) return;
    this.resetState();
    this.closed.emit();
  }
}