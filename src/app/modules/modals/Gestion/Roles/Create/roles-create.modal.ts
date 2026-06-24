import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RolesService } from '../../../../Suadmin/Gestion/gestion.service';
import { Role } from '../../../../Suadmin/Gestion/role.types';
import { MasterPasswordModal } from '../../../Passoword/master-password.modal';

@Component({
  selector: 'roles-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MasterPasswordModal],
  templateUrl: './roles-create.modal.html',
})
export class RolesCreateModal implements OnInit {
  @Input() role: Role | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);

  saving = false;
  formError = '';
  drawerDeltaY = 0;
  private touchStartY = 0;
  showMasterModal = false;
  private pendingPayload: { name: string } | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnInit() {
    if (this.role) {
      this.form.patchValue({ name: this.role.name });
    }
  }

  hasError(field: string) {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.pendingPayload = this.form.value as { name: string };
    this.showMasterModal = true;
  }

  onMasterConfirmed(masterPassword: string) {
    this.showMasterModal = false;
    if (!this.pendingPayload) return;

    this.saving = true;
    this.formError = '';
    this.rolesService.masterPassword = masterPassword;

    const req = this.role
      ? this.rolesService.updateRole(this.role.id, this.pendingPayload)
      : this.rolesService.createRole(this.pendingPayload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.pendingPayload = null;
        this.saved.emit();
      },
      error: (e) => {
        this.saving = false;
        this.formError = e?.error?.message ?? 'Error al guardar rol';
        if (e?.status === 403) {
          this.showMasterModal = true;
        } else {
          this.pendingPayload = null;
        }
      },
    });
  }

  onMasterCancelled() {
    this.showMasterModal = false;
    this.pendingPayload = null;
  }

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