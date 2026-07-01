// rutina-show-modal.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Workout } from '../../../../Coach/Expediente/expediente.service';

@Component({
  selector: 'rutina-show-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './rutina-show-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutinaShowModalComponent {
  /** Controla si el modal está visible */
  @Input() show = false;

  /** Rutina a mostrar */
  @Input() rutina: Workout | null = null;

  /** Diccionarios de etiquetas legibles */
  @Input() goalLabel: Record<string, string> = {};
  @Input() levelLabel: Record<string, string> = {};

  @Output() closeModal = new EventEmitter<void>();
  @Output() editRutina = new EventEmitter<Workout>();
  @Output() toggleRutina = new EventEmitter<Workout>();
  @Output() deleteRutina = new EventEmitter<Workout>();

  onClose() {
    this.closeModal.emit();
  }

  onEdit() {
    if (this.rutina) this.editRutina.emit(this.rutina);
  }

  onToggle() {
    if (this.rutina) this.toggleRutina.emit(this.rutina);
  }

  onDelete() {
    if (this.rutina) this.deleteRutina.emit(this.rutina);
  }
}