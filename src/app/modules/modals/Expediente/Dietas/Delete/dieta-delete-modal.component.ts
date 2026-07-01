
// dieta-delete-modal.component.ts
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
  selector: 'dieta-delete-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dieta-delete-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietaDeleteModalComponent {
  /** Controla si el modal está visible */
  @Input() show = false;

  /** Dieta a eliminar */
  @Input() dieta: Diet | null = null;

  /** Estado de guardado (deshabilita botones mientras procesa) */
  @Input() saving = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<Diet>();

  onClose() {
    if (this.saving) return;
    this.closeModal.emit();
  }

  onConfirm() {
    if (this.dieta) this.confirmDelete.emit(this.dieta);
  }
}