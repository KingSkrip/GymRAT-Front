// rutina-delete-modal.component.ts
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
  selector: 'rutina-delete-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './rutina-delete-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutinaDeleteModalComponent {
  /** Controla si el modal está visible */
  @Input() show = false;

  /** Rutina a eliminar */
  @Input() rutina: Workout | null = null;

  /** Estado de guardado (deshabilita botones mientras procesa) */
  @Input() saving = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<Workout>();

  onClose() {
    if (this.saving) return;
    this.closeModal.emit();
  }

  onConfirm() {
    if (this.rutina) this.confirmDelete.emit(this.rutina);
  }
}