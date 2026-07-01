import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GestionUser } from '../../../../Suadmin/Gestion/users.types';
import { RolesService } from '../../../../Suadmin/Gestion/gestion.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MasterPasswordModal } from '../../../Passoword/master-password.modal';
import { MODAL_ROLE_CONFIG } from '../../../../auth/roles/role-modal-config';
import { RoleEnum } from '../../../../auth/roles/dataroles';

@Component({
  selector: 'usuarios-create-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MasterPasswordModal,
  ],
  templateUrl: './usuarios-create.modal.html',
})
export class UsuariosCreateModal implements OnInit, OnChanges {
  @Input() user: GestionUser | null = null;
  @Input() roles: any[] = [];
  @Input() subRoles: any[] = [];
  @Input() defaultRole: 'superadmin' | 'admin' | 'client' | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private cdr = inject(ChangeDetectorRef);

  saving = false;
  formError = '';
  showMasterModal = false;
  drawerDeltaY = 0;
  private touchStartY = 0;
  private pendingPayload: any = null;

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role_id: [null as number | null, Validators.required],
    sub_role_id: [null as number | null],
    is_active: [true],
  });

  ngOnInit() {
    this.patchUserForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['roles'] || changes['subRoles'] || changes['user']) {
      this.patchUserForm();
    }
  }

private patchUserForm() {
  if (!this.user) return;

  this.form.get('password')?.clearValidators();
  this.form.get('password')?.setValidators([Validators.minLength(8)]);
  this.form.get('password')?.updateValueAndValidity();

  this.form.patchValue({
    name:        this.user.name,
    email:       this.user.email,
    // 🔥 usa permissions si role?.id no existe
    role_id:     this.user.role?.id ?? this.user.permissions ?? null,
    sub_role_id: this.user.sub_role?.id ?? this.user.sub_permissions ?? null,
    is_active:   this.user.is_active,
  });

  this.cdr.markForCheck();
}
  hasError(field: string) {
    const c = this.form.get(field);
    return c?.invalid && c?.touched;
  }

  // 1. El form se valida y si está OK abre el master modal
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const payload: any = { ...this.form.value };

    if (!this.user) {
      const typeMap: Record<string, string> = {
        superadmin: 'admin',
        admin: 'admin',
        client: 'client',
      };
      payload.type = this.defaultRole ? (typeMap[this.defaultRole] ?? 'client') : 'client';
    }

    if (this.user && !payload.password) delete payload.password;

    this.pendingPayload = payload;
    this.showMasterModal = true;
  }

  // 2. Master modal confirma → ejecuta la petición
  onMasterConfirmed(masterPassword: string) {
    this.showMasterModal = false;
    this.saving = true;
    this.formError = '';
    this.rolesService.masterPassword = masterPassword;

    const req = this.user
      ? this.rolesService.updateUser(this.user.id, this.pendingPayload)
      : this.rolesService.createUser(this.pendingPayload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (e: any) => {
        this.saving = false;
        if (e?.status === 403) {
          this.formError = 'Contraseña maestra incorrecta.';
          this.showMasterModal = true; // reabre si fue incorrecta
        } else {
          this.formError = this.parseError(e);
        }
        this.cdr.detectChanges();
      },
    });
  }

  onMasterCancelled() {
    this.showMasterModal = false;
    this.pendingPayload = null;
  }

  private parseError(e: any): string {
    const errors = e?.error?.errors;

    if (errors) {
      const fallbackMap: Record<string, Record<string, string>> = {
        email: {
          'validation.unique': 'Este correo ya está registrado.',
          'validation.email': 'El correo no es válido.',
          'validation.required': 'El correo es requerido.',
        },
        name: { 'validation.required': 'El nombre es requerido.' },
        password: {
          'validation.min.string': 'La contraseña debe tener al menos 8 caracteres.',
          'validation.required': 'La contraseña es requerida.',
        },
      };

      for (const campo of Object.keys(errors)) {
        const erroresDelCampo: string[] = Array.isArray(errors[campo])
          ? errors[campo]
          : [errors[campo]];

        for (const error of erroresDelCampo) {
          if (!error.startsWith('validation.')) return error;
          const mensaje = fallbackMap[campo]?.[error];
          if (mensaje) return mensaje;
        }
      }

      const primerCampo = Object.keys(errors)[0];
      return errors[primerCampo]?.[0] ?? 'Error de validación.';
    }

    if (e?.status === 0) return 'Sin conexión al servidor.';
    if (e?.status === 500) return 'Error interno del servidor.';
    return e?.error?.message ?? 'Ocurrió un error al guardar.';
  }

  onDrawerTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY;
  }
  onDrawerTouchMove(e: TouchEvent) {
    const delta = e.touches[0].clientY - this.touchStartY;
    if (delta > 0) this.drawerDeltaY = delta;
  }
  onDrawerTouchEnd() {
    if (this.drawerDeltaY > 80) this.closed.emit();
    this.drawerDeltaY = 0;
  }

  esRequerido(controlName: string): boolean {
    const control = this.form.get(controlName);
    if (!control) return false;
    return control.hasValidator(Validators.required);
  }


get resolvedRoleContext(): string | null {
  // Si viene de un botón (crear), usa defaultRole
  if (this.defaultRole) return this.defaultRole;

  // Si es edición, lo deriva del permissions del usuario
  if (this.user) {
    const p = Number(this.user.permissions);
    if (p === RoleEnum.superadmin) return 'superadmin';
    if (p === RoleEnum.client)     return 'client';
    // gym_owner, admin, coach → contexto admin
    if ([RoleEnum.gym_owner, RoleEnum.admin, RoleEnum.coach].includes(p)) return 'admin';
  }

  return null;
}

get filteredRoles(): any[] {
  const config = MODAL_ROLE_CONFIG[this.resolvedRoleContext ?? ''];
  if (!config) return this.roles;
  return this.roles.filter(r => config.allowedRoles.includes(r.id));
}

get filteredSubRoles(): any[] {
  const config = MODAL_ROLE_CONFIG[this.resolvedRoleContext ?? ''];
  if (!config || config.allowedSubRoles.length === 0) return [];
  return this.subRoles.filter(s => config.allowedSubRoles.includes(s.id));
}

get showSubRoles(): boolean {
  const config = MODAL_ROLE_CONFIG[this.resolvedRoleContext ?? ''];
  return config ? config.allowedSubRoles.length > 0 : true;
}
}
