// rutina-toggle-modal.component.ts
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
  selector: 'rutina-toggle-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './rutina-toggle-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutinaToggleModalComponent {
  /** Controla si el modal está visible */
  @Input() show = false;

  /** Rutina a activar/desactivar */
  @Input() rutina: Workout | null = null;

  /** Estado de guardado (deshabilita botones mientras procesa) */
  @Input() saving = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmToggle = new EventEmitter<Workout>();

  onClose() {
    if (this.saving) return;
    this.closeModal.emit();
  }

  onConfirm() {
    if (this.rutina) this.confirmToggle.emit(this.rutina);
  }
}