import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterPasswordModal } from '../../../Passoword/master-password.modal';
import { RolesService } from '../../../../Suadmin/Gestion/gestion.service';


@Component({
  selector: 'subroles-delete-modal',
  standalone: true,
  imports: [CommonModule, MasterPasswordModal],
  templateUrl: './subroles-delete.modal.html',
})
export class SubrolesDeleteModal {
  @Input() subRole: any;
  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  private rolesService = inject(RolesService);
  saving = false;
  showMasterModal = false;
  masterError = '';
  drawerDeltaY = 0;
  private touchStartY = 0;

  requestDelete() { this.showMasterModal = true; }

  onMasterConfirmed(masterPassword: string) {
    this.showMasterModal = false;
    this.saving = true;
    this.rolesService.masterPassword = masterPassword;

    this.rolesService.deleteSubRole(this.subRole.id).subscribe({
      next: () => { this.saving = false; this.deleted.emit(); },
      error: (e) => {
        this.saving = false;
        if (e?.status === 403) {
          this.masterError = 'Contraseña maestra incorrecta.';
          this.showMasterModal = true;
        }
      },
    });
  }

  onMasterCancelled() { this.showMasterModal = false; }

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