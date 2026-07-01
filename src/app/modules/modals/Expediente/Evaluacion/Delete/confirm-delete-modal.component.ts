import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './confirm-delete-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteModalComponent {
  @Input() open = false;
  @Input({ required: true }) entityLabel!: string;
  @Input() itemLabel = '';
  @Input() saving = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() closedModal = new EventEmitter<void>();
  get title(): string {
    return `Eliminar ${this.entityLabel}`;
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
