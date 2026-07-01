import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ClientGymGroup, GestionUser } from '../../../../Suadmin/Gestion/users.types';
import { RoleEnum, Roles, SubRoles } from '../../../../auth/roles/dataroles';
import { AuthService } from '../../../../auth/auth.service';

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
  @Output() openMembership = new EventEmitter<GestionUser>();
  private authService = inject(AuthService);
  currentUserRole: string | null = null;
  superadmins: GestionUser[] = [];
  admins: GestionUser[] = [];
  clientGroups: ClientGymGroup[] = [];
  drawerDeltaY = 0;
  private touchStartY = 0;
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

  get isSuperAdmin(): boolean {
    return Number(this.authService.getUser()?.permissions) === RoleEnum.superadmin;
  }

  get showAdmins(): boolean {
    return this.admins.length > 0;
  }
  get showClients(): boolean {
    return this.clientGroups.length > 0;
  }

  // Label dinámico para la sección de superadmins según el rol
  get superadminsLabel(): string {
    // Si no es superadmin viendo su propio panel, es el contacto del sistema
    return this.currentUserRole === 'superadmin' ? 'Superadministradores' : 'Contacto del sistema';
  }

  get roleName(): string {
    return this.user.permissions != null
      ? (Roles[this.user.permissions as keyof typeof Roles] ?? '—')
      : '—';
  }

  get subRoleName(): string {
    return this.user.sub_permissions != null
      ? (SubRoles[this.user.sub_permissions as keyof typeof SubRoles] ?? '—')
      : '—';
  }

  get canManageUser(): boolean {
    const targetPermissions = Number(this.user?.permissions);
    const isSuperAdminUser = targetPermissions === RoleEnum.superadmin;
    if (isSuperAdminUser) {
      return this.isSuperAdmin;
    }
    return true;
  }

  get membershipVencida(): boolean {
    return !this.user.membership || !this.user.membership.is_valid;
  }

  get isClient(): boolean {
    return Number(this.user?.permissions) === RoleEnum.client;
  }

  get membershipTypeLabel(): string {
    const types: Record<string, string> = {
      monthly: 'Mensual',
      yearly: 'Anual',
      visit: 'Visita',
      custom: 'Personalizada',
    };
    const type = this.user.membership?.type;
    return type ? (types[type] ?? '—') : '—';
  }

  get shouldShowMembershipButton(): boolean {
    if (!this.isClient) return false;
    const m = this.user.membership;
    if (!m) return true;
    if (!m.is_valid) return true;
    if (m.type === 'visit') return true;
    if (m.remaining_days <= 7) return true;
    return false;
  }
}
