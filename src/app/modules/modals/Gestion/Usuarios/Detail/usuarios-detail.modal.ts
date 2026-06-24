import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GestionUser } from '../../../../Suadmin/Gestion/users.types';

@Component({
  selector: 'usuarios-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './usuarios-detail.modal.html',
})
export class UsuariosDetailModal {
  @Input() user!: GestionUser;
  @Output() closed = new EventEmitter<void>();
  @Output() editUser = new EventEmitter<GestionUser>();
  @Output() deleteUser = new EventEmitter<GestionUser>();

  drawerDeltaY = 0;
  private touchStartY = 0;
  onDrawerTouchStart(e: TouchEvent) { this.touchStartY = e.touches[0].clientY; }
  onDrawerTouchMove(e: TouchEvent) {
    const delta = e.touches[0].clientY - this.touchStartY;
    if (delta > 0) this.drawerDeltaY = delta;
  }
  onDrawerTouchEnd() {
    if (this.drawerDeltaY > 80) this.closed.emit();
    this.drawerDeltaY = 0;
  }
}