import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'roles-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './roles-detail.modal.html',
})
export class RolesDetailModal {
  @Input() role: any;
  @Output() closed = new EventEmitter<void>();
  @Output() editRole = new EventEmitter<any>();
  @Output() deleteRole = new EventEmitter<any>();

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