import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AssessmentPayload } from '../../../../Coach/Expediente/expediente.service';

export type EvaluacionFormModel = Partial<AssessmentPayload> & {
  measurements: NonNullable<AssessmentPayload['measurements']>;
  skinfolds: NonNullable<AssessmentPayload['skinfolds']>;
};

type MeasurementKey = keyof NonNullable<AssessmentPayload['measurements']>;
type SkinfoldKey = keyof NonNullable<AssessmentPayload['skinfolds']>;

interface FieldDef<K extends string> {
  key: K;
  label: string;
}

@Component({
  selector: 'app-evaluacion-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './evaluacion-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluacionFormModalComponent {
  /** Abre/cierra el modal */
  @Input() open = false;
  /** true = editando una evaluación existente, false = nueva */
  @Input() editing = false;
  /** Modelo del formulario (lo controla el padre, two-way vía ngModel interno) */
  @Input({ required: true }) form!: EvaluacionFormModel;
  /** Loading mientras se guarda */
  @Input() saving = false;

  @Output() closedModal = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  readonly measurementFields: FieldDef<MeasurementKey>[] = [
    { key: 'neck', label: 'Cuello' },
    { key: 'shoulders', label: 'Hombros' },
    { key: 'chest', label: 'Pecho' },
    { key: 'left_arm', label: 'Brazo izq.' },
    { key: 'right_arm', label: 'Brazo der.' },
    { key: 'waist', label: 'Cintura' },
    { key: 'abdomen', label: 'Abdomen' },
    { key: 'hip', label: 'Cadera' },
    { key: 'left_thigh', label: 'Muslo izq.' },
    { key: 'right_thigh', label: 'Muslo der.' },
    { key: 'left_calf', label: 'Pantorrilla izq.' },
    { key: 'right_calf', label: 'Pantorrilla der.' },
  ];

  readonly skinfoldFields: FieldDef<SkinfoldKey>[] = [
    { key: 'chest', label: 'Pecho' },
    { key: 'tricep', label: 'Tríceps' },
    { key: 'subscapular', label: 'Subescapular' },
    { key: 'midaxillary', label: 'Axilar media' },
    { key: 'suprailiac', label: 'Suprailíaco' },
    { key: 'abdomen', label: 'Abdomen' },
    { key: 'thigh', label: 'Muslo' },
    { key: 'calf', label: 'Pantorrilla' },
  ];

  /** Helpers para que el template no indexe el objeto directamente (evita TS7053) */
  getMeasurement(key: MeasurementKey): number | undefined {
    return this.form.measurements[key];
  }
  setMeasurement(key: MeasurementKey, value: number | undefined) {
    this.form.measurements[key] = value;
  }

  getSkinfold(key: SkinfoldKey): number | undefined {
    return this.form.skinfolds[key];
  }
  setSkinfold(key: SkinfoldKey, value: number | undefined) {
    this.form.skinfolds[key] = value;
  }

  close() {
    if (this.saving) return;
    this.closedModal.emit();
  }

  onBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) this.close();
  }

  onSave() {
    if (this.saving) return;
    this.save.emit();
  }
}