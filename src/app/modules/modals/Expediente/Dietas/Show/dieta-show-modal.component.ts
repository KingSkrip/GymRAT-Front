// dieta-show-modal.component.ts
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Diet } from '../../../../Coach/Expediente/expediente.service'; // ajusta la ruta a tu service

@Component({
  selector: 'dieta-show-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dieta-show-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietaShowModalComponent {
  /** Controla si el modal está visible */
  @Input() show = false;

  /** Dieta a mostrar */
  @Input() dieta: Diet | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() editDieta = new EventEmitter<Diet>();
  @Output() toggleDieta = new EventEmitter<Diet>();
  @Output() deleteDieta = new EventEmitter<Diet>();

  onClose() {
    this.closeModal.emit();
  }

  onEdit() {
    if (this.dieta) this.editDieta.emit(this.dieta);
  }

  onToggle() {
    if (this.dieta) this.toggleDieta.emit(this.dieta);
  }

  onDelete() {
    if (this.dieta) this.deleteDieta.emit(this.dieta);
  }
}
