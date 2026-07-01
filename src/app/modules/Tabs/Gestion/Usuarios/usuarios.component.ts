import { Component, OnInit, inject, ChangeDetectorRef, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import {
  ClientGymGroup,
  GestionUser,
  RolesService,
} from '../../../Suadmin/Gestion/gestion.service';
import { LoaderComponent } from '../../../../layout/layouts/loader/loader.component';
import { UsuariosCreateModal } from '../../../modals/Gestion/Usuarios/Create/usuarios-create.modal';
import { UsuariosDeleteModal } from '../../../modals/Gestion/Usuarios/Delete/usuarios-delete.modal';
import { UsuariosDetailModal } from '../../../modals/Gestion/Usuarios/Detail/usuarios-detail.modal';
import { RoleEnum, Roles, SubRoles } from '../../../auth/roles/dataroles';
import { AuthService } from '../../../auth/auth.service';
import { MembershipModalComponent } from '../../../modals/Membresias/membership-modal.component';

type ModalMode = 'create-edit' | 'detail' | 'confirm-delete' | 'membership' | null;
type UserRoleContext = 'superadmin' | 'admin' | 'client' | null;

@Component({
  selector: 'gestion-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    LoaderComponent,
    UsuariosCreateModal,
    UsuariosDeleteModal,
    UsuariosDetailModal,
    MembershipModalComponent,
  ],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  @Input() user!: GestionUser;
  private rolesService = inject(RolesService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  activeTab: 'users' | 'roles' | 'subroles' = 'users';
  currentUserRole: string | null = null;
  superadmins: GestionUser[] = [];
  admins: GestionUser[] = [];
  clientGroups: ClientGymGroup[] = [];
  isMobile = window.innerWidth < 640;
  selectedUser: GestionUser | null = null;
  modalMode: ModalMode = null;
  addUserRoleContext: UserRoleContext = null;
  superadminsExpanded = false;
  superadminsPage = 1;
  adminsExpanded = false;
  adminsPage = 1;
  clientGroupsExpanded: Record<string, boolean> = {};
  clientsPage = 1;
  roles: any[] = [];
  subRoles: any[] = [];

  loading = true;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 640;
    this.cdr.markForCheck();
  }

  // ── Superadmins ──
  get superadminsLimit() {
    return this.isMobile ? 1 : 3;
  }
  get superadminsPageSize() {
    return this.isMobile ? 5 : 6;
  }
  get superadminsVisible() {
    const start = (this.superadminsPage - 1) * this.superadminsPageSize;
    const slice = this.superadmins.slice(start, start + this.superadminsPageSize);
    return this.superadminsExpanded ? slice : slice.slice(0, this.superadminsLimit);
  }
  get superadminsCollapsed() {
    const start = (this.superadminsPage - 1) * this.superadminsPageSize;
    const slice = this.superadmins.slice(start, start + this.superadminsPageSize);
    return this.superadminsExpanded ? [] : slice.slice(this.superadminsLimit);
  }
  get superadminsTotalPages() {
    return Math.ceil(this.superadmins.length / this.superadminsPageSize);
  }

  // ── Admins ──
  get adminsLimit() {
    return this.isMobile ? 1 : 3;
  }
  get adminsPageSize() {
    return this.isMobile ? 5 : 6;
  }
  get adminsVisible() {
    const start = (this.adminsPage - 1) * this.adminsPageSize;
    const slice = this.admins.slice(start, start + this.adminsPageSize);
    return this.adminsExpanded ? slice : slice.slice(0, this.adminsLimit);
  }
  get adminsCollapsed() {
    const start = (this.adminsPage - 1) * this.adminsPageSize;
    const slice = this.admins.slice(start, start + this.adminsPageSize);
    return this.adminsExpanded ? [] : slice.slice(this.adminsLimit);
  }
  get adminsTotalPages() {
    return Math.ceil(this.admins.length / this.adminsPageSize);
  }

  // ── Clientes ──
  get clientsLimit() {
    return this.isMobile ? 1 : 3;
  }
  get clientsPageSize() {
    return this.isMobile ? 5 : 6;
  }
  get pagedClientGroups() {
    const start = (this.clientsPage - 1) * this.clientsPageSize;
    const allClients = this.clientGroups.flatMap((g) =>
      g.users.map((u) => ({
        ...u,
        _gymId: String(g.gym?.id ?? 'general'),
        _gymName: g.gym?.name ?? 'Usuarios generales',
      })),
    );
    const paged = allClients.slice(start, start + this.clientsPageSize);
    const map = new Map<string, { gym: any; users: any[] }>();
    for (const u of paged) {
      if (!map.has(u._gymId))
        map.set(u._gymId, {
          gym:
            this.clientGroups.find((g) => String(g.gym?.id ?? 'general') === u._gymId)?.gym ?? null,
          users: [],
        });
      map.get(u._gymId)!.users.push(u);
    }
    return Array.from(map.values());
  }
  get clientsTotalPages() {
    const total = this.clientGroups.reduce((acc, g) => acc + g.users.length, 0);
    return Math.ceil(total / this.clientsPageSize);
  }

  gymKey(gym: any): string {
    return String(gym?.id ?? 'general');
  }
  isGroupExpanded(gymId: string) {
    return !!this.clientGroupsExpanded[gymId];
  }
  toggleGroupExpanded(gymId: string) {
    this.clientGroupsExpanded[gymId] = !this.clientGroupsExpanded[gymId];
    this.cdr.markForCheck();
  }
  getGroupVisible(group: { gym: any; users: GestionUser[] }) {
    const id = this.gymKey(group.gym);
    return this.isGroupExpanded(id) ? group.users : group.users.slice(0, this.clientsLimit);
  }
  getGroupCollapsed(group: { gym: any; users: GestionUser[] }) {
    const id = this.gymKey(group.gym);
    return this.isGroupExpanded(id) ? 0 : Math.max(0, group.users.length - this.clientsLimit);
  }

  ngOnInit(): void {
    this.loading = true;
    this.reloadUsers();
  }

  openDetail(user: GestionUser): void {
    this.selectedUser = user;
    this.modalMode = 'detail';
    this.cdr.markForCheck();
  }
  openEdit(user: GestionUser, event?: Event): void {
    event?.stopPropagation();
    this.selectedUser = user;
    this.addUserRoleContext = null;
    this.modalMode = 'create-edit';
    this.cdr.markForCheck();
  }
  openDeleteConfirm(user: GestionUser, event?: Event): void {
    event?.stopPropagation();
    this.selectedUser = user;
    this.modalMode = 'confirm-delete';
    this.cdr.markForCheck();
  }
  openAddUser(role?: UserRoleContext, event?: Event): void {
    event?.stopPropagation();
    this.selectedUser = null;
    this.addUserRoleContext = role ?? null;
    this.modalMode = 'create-edit';
    this.cdr.markForCheck();
  }
  closeModal(): void {
    this.selectedUser = null;
    this.modalMode = null;
    this.addUserRoleContext = null;
    this.cdr.markForCheck();
  }

  get visibleClientPages(): number[] {
    const total = this.clientsTotalPages;
    const windowSize = 5;

    if (total <= windowSize) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = this.clientsPage - Math.floor(windowSize / 2);
    start = Math.max(1, start);

    let end = start + windowSize - 1;
    if (end > total) {
      end = total;
      start = end - windowSize + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get visibleSuperadminPages(): number[] {
    const total = this.superadminsTotalPages;
    const windowSize = 5;
    if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, this.superadminsPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > total) {
      end = total;
      start = end - windowSize + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get visibleAdminPages(): number[] {
    const total = this.adminsTotalPages;
    const windowSize = 5;
    if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, this.adminsPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > total) {
      end = total;
      start = end - windowSize + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  onUserSaved() {
    this.closeModal();
    this.reloadUsers();
  }

  onUserDeleted() {
    this.closeModal();
    this.reloadUsers();
  }

  reloadUsers() {
    this.loading = true;

    forkJoin({
      rolesResp: this.rolesService.getRoles(),
      subRolesResp: this.rolesService.getSubRoles(),
      usersResp: this.rolesService.getUsers(),
    }).subscribe({
      next: ({ rolesResp, usersResp, subRolesResp }) => {
        this.superadmins = usersResp.superadmins ?? [];
        this.admins = usersResp.admins ?? [];
        this.clientGroups = usersResp.clients ?? [];
        this.roles = rolesResp.roles ?? [];
        this.subRoles = subRolesResp.sub_roles ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  // Getters de visibilidad de secciones

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

  getRoleName(user: GestionUser): string {
    return user.permissions != null ? (Roles[user.permissions as keyof typeof Roles] ?? '—') : '—';
  }

  getSubRoleName(user: GestionUser): string {
    return user.sub_permissions != null
      ? (SubRoles[user.sub_permissions as keyof typeof SubRoles] ?? '—')
      : '—';
  }

  getMembershipType(type: string): string {
    const types: Record<string, string> = {
      monthly: 'Mensual',
      yearly: 'Anual',
      visit: 'Visita',
      custom: 'Personalizada',
    };
    return types[type] ?? type;
  }

  openMembershipModal(user: GestionUser): void {
    this.selectedUser = user;
    this.modalMode = 'membership';
    this.cdr.markForCheck();
  }

  onMembershipSaved(): void {
    this.closeModal();
    this.reloadUsers();
  }
}
