import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'master-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './master-password.modal.html',
})
export class MasterPasswordModal {
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  password = '';
  error = '';

  confirm() {
    if (!this.password.trim()) {
      this.error = 'Ingresa la contraseña maestra.';
      return;
    }
    this.confirmed.emit(this.password);
    this.password = '';
    this.error = '';
  }
}