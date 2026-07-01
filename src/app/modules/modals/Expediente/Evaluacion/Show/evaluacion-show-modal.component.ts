import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  Assessment,
  AssessmentPayload,
  ExpedienteService,
} from '../../../../Coach/Expediente/expediente.service';

type PhotoKey = 'front' | 'back' | 'left_side' | 'right_side';

const PHOTO_LABELS: Record<PhotoKey, string> = {
  front: 'Frente',
  back: 'Espalda',
  left_side: 'Lateral izq.',
  right_side: 'Lateral der.',
};

@Component({
  selector: 'app-evaluacion-show-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './evaluacion-show-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluacionShowModalComponent {
  @Input() open = false;

  @Input() assessment: Assessment | null = null;

  @Output() closedModal = new EventEmitter<void>();

  @Output() editRequested = new EventEmitter<Assessment>();

  @Output() deletePhoto = new EventEmitter<{
    assessment: Assessment;
    key: PhotoKey;
  }>();

  readonly photoKeys: PhotoKey[] = ['front', 'back', 'left_side', 'right_side'];
  readonly photoLabels = PHOTO_LABELS;

  get metrics() {
    const a = this.assessment;
    if (!a) return [];
    return [
      { label: 'Peso', val: a.weight, unit: 'kg' },
      { label: '% Grasa', val: a.body_fat, unit: '%' },
      { label: 'Músculo', val: a.muscle_mass, unit: 'kg' },
      { label: 'Agua', val: a.water_percentage, unit: '%' },
      { label: 'IMC', val: a.bmi, unit: '' },
      { label: 'G.Visc.', val: a.visceral_fat, unit: '' },
    ];
  }

  get formattedDate(): string {
    if (!this.assessment?.created_at) return '';
    return new Date(this.assessment.created_at).toLocaleDateString('es-MX');
  }

  close() {
    this.closedModal.emit();
  }

  onBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) this.close();
  }

  edit() {
    if (this.assessment) this.editRequested.emit(this.assessment);
  }

  onDeletePhoto(key: PhotoKey) {
    if (this.assessment) this.deletePhoto.emit({ assessment: this.assessment, key });
  }
}
