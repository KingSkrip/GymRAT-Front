// dieta-toggle-modal.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Diet } from '../../../../Coach/Expediente/expediente.service'; // ajusta la ruta a tu service

@Component({
  selector: 'dieta-toggle-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dieta-toggle-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietaToggleModalComponent {
  /** Controla si el modal está visible */
  @Input() show = false;

  /** Dieta a activar/desactivar */
  @Input() dieta: Diet | null = null;

  /** Estado de guardado (deshabilita botones mientras procesa) */
  @Input() saving = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmToggle = new EventEmitter<Diet>();

  onClose() {
    if (this.saving) return;
    this.closeModal.emit();
  }

  onConfirm() {
    if (this.dieta) this.confirmToggle.emit(this.dieta);
  }
}