// foto-delete-modal.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ExpedienteService } from '../../../../Coach/Expediente/expediente.service';


type PhotoKey = 'front' | 'back' | 'left_side' | 'right_side';

@Component({
  selector: 'coach-foto-delete-modal',
  standalone: true,
  templateUrl: './foto-delete-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
})
export class FotoDeleteModalComponent {
  private svc = inject(ExpedienteService);
  private cdr = inject(ChangeDetectorRef);

  // ── Inputs ────────────────────────────────────────────────────────────────
  @Input() isOpen = false;
  @Input() assessmentId: number | null = null;
  @Input() photoKey: PhotoKey | null = null;
  @Input() photoLabel = '';

  // ── Outputs ───────────────────────────────────────────────────────────────
  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<{ assessmentId: number; photoKey: PhotoKey }>();

  saving = false;
  errorMsg: string | null = null;

  confirm() {
    if (!this.assessmentId || !this.photoKey || this.saving) return;

    this.saving = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.svc.deleteAssessmentPhoto(this.assessmentId, this.photoKey).subscribe({
      next: () => {
        this.saving = false;
        this.deleted.emit({ assessmentId: this.assessmentId!, photoKey: this.photoKey! });
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.errorMsg = 'No se pudo eliminar la foto. Intenta de nuevo.';
        this.cdr.markForCheck();
      },
    });
  }

  close() {
    if (this.saving) return;
    this.errorMsg = null;
    this.closed.emit();
  }
}