import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-toggle-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-toggle-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmToggleModalComponent {
  /** Abre/cierra el modal */
  @Input() open = false;
  /** Nombre de la entidad para el título, ej. 'dieta', 'rutina' */
  @Input({ required: true }) entityLabel!: string;
  /** Estado actual (true = activo, false = inactivo) */
  @Input({ required: true }) isActive!: boolean;
  /** Texto identificador del registro, ej. nombre/título */
  @Input() itemLabel = '';
  /** Loading mientras se confirma */
  @Input() saving = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() closedModal = new EventEmitter<void>();

  get title(): string {
    return this.isActive ? `Desactivar ${this.entityLabel}` : `Activar ${this.entityLabel}`;
  }

  get description(): string {
    return this.isActive
      ? 'El alumno dejará de ver este contenido en su app.'
      : 'El alumno podrá ver este contenido nuevamente en su app.';
  }

  close() {
    if (this.saving) return;
    this.closedModal.emit();
  }

  onBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) this.close();
  }

  confirm() {
    if (this.saving) return;
    this.confirmed.emit();
  }
}
