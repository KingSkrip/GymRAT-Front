import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RolesService, ClientGymGroup, GestionUser } from './gestion.service';
import { forkJoin } from 'rxjs';

type ModalMode = 'create-edit' | 'detail' | 'confirm-delete' | null;
type UserRoleContext = 'superadmin' | 'admin' | 'client' | null;

@Component({
  selector: 'suadmin-gestion',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './gestion.component.html',
})
export class GestionComponent implements OnInit {
  private rolesService = inject(RolesService);
  private cdr = inject(ChangeDetectorRef);
  activeTab: 'users' | 'roles' | 'subroles' = 'users';
  roles: any[] = [];
  subRoles: any[] = [];
  superadmins: GestionUser[] = [];
  admins: GestionUser[] = [];
  clientGroups: ClientGymGroup[] = [];
  isMobile = window.innerWidth < 640;
  rolesPage = 1;
  rolesPageSize = 10;
  subRolesPage = 1;
  subRolesPageSize = 10;
  selectedUser: GestionUser | null = null;
  modalMode: ModalMode = null;
  addUserRoleContext: UserRoleContext = null;
  superadminsExpanded = false;
  superadminsPage = 1;
  adminsExpanded = false;
  adminsPage = 1;
  clientGroupsExpanded: Record<string, boolean> = {};
  clientsPage = 1;
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

  // ── Roles / SubRoles ──
  get pagedRoles() {
    const start = (this.rolesPage - 1) * this.rolesPageSize;
    return this.roles.slice(start, start + this.rolesPageSize);
  }
  get rolesTotalPages() {
    return Math.ceil(this.roles.length / this.rolesPageSize);
  }
  get pagedSubRoles() {
    const start = (this.subRolesPage - 1) * this.subRolesPageSize;
    return this.subRoles.slice(start, start + this.subRolesPageSize);
  }
  get subRolesTotalPages() {
    return Math.ceil(this.subRoles.length / this.subRolesPageSize);
  }

  min(a: number, b: number) {
    return Math.min(a, b);
  }

  ngOnInit(): void {
    forkJoin({
      rolesResp: this.rolesService.getRoles(),
      usersResp: this.rolesService.getUsers(),
    }).subscribe({
      next: ({ rolesResp, usersResp }) => {
        this.roles = rolesResp.roles ?? [];
        this.subRoles = rolesResp.sub_roles ?? [];
        this.superadmins = usersResp.superadmins ?? [];
        this.admins = usersResp.admins ?? [];
        this.clientGroups = usersResp.clients ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err),
    });
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

get visibleRolesPages(): number[] {
  const total = this.rolesTotalPages;
  const windowSize = 5;
  if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, this.rolesPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > total) { end = total; start = end - windowSize + 1; }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

get visibleSubRolesPages(): number[] {
  const total = this.subRolesTotalPages;
  const windowSize = 5;
  if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, this.subRolesPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > total) { end = total; start = end - windowSize + 1; }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}


get visibleSuperadminPages(): number[] {
  const total = this.superadminsTotalPages;
  const windowSize = 5;
  if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, this.superadminsPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > total) { end = total; start = end - windowSize + 1; }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

get visibleAdminPages(): number[] {
  const total = this.adminsTotalPages;
  const windowSize = 5;
  if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, this.adminsPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > total) { end = total; start = end - windowSize + 1; }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
}
