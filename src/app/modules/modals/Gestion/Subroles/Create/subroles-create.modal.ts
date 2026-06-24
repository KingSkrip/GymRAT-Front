import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RolesService } from '../../../../Suadmin/Gestion/gestion.service';
import { SubRole } from '../../../../Suadmin/Gestion/subroles.types';
import { MasterPasswordModal } from '../../../Passoword/master-password.modal';

@Component({
  selector: 'subroles-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MasterPasswordModal],
  templateUrl: './subroles-create.modal.html',
})
export class SubrolesCreateModal implements OnInit {
  @Input() subRole: SubRole | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);

  saving = false;
  formError = '';
  drawerDeltaY = 0;
  private touchStartY = 0;
  showMasterModal = false;
  private pendingPayload: { name: string; description: string } | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
  });

  ngOnInit() {
    if (this.subRole) {
      this.form.patchValue({
        name: this.subRole.name,
        description: this.subRole.description,
      });
    }
  }

  hasError(field: string) {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    // Guardar payload y mostrar modal de contraseña
    this.pendingPayload = this.form.value as { name: string; description: string };
    this.showMasterModal = true;
  }

  onMasterConfirmed(masterPassword: string) {
    this.showMasterModal = false;
    if (!this.pendingPayload) return;

    this.saving = true;
    this.formError = '';
    this.rolesService.masterPassword = masterPassword;

    const req = this.subRole
      ? this.rolesService.updateSubRole(this.subRole.id, this.pendingPayload)
      : this.rolesService.createSubRole(this.pendingPayload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.pendingPayload = null;
        this.saved.emit();
      },
      error: (e) => {
        this.saving = false;
        this.formError = e?.error?.message ?? 'Error al guardar subrol';

        if (e?.status === 403) {
          this.showMasterModal = true; // contraseña incorrecta, reintentar
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