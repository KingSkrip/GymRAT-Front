import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { forkJoin } from 'rxjs';
import { GestionUser, RolesService } from '../../../Suadmin/Gestion/gestion.service';
import { LoaderComponent } from '../../../../layout/layouts/loader/loader.component';
import { RolesCreateModal } from '../../../modals/Gestion/Roles/Create/roles-create.modal';
import { RolesDeleteModal } from '../../../modals/Gestion/Roles/Delete/roles-delete.modal';
import { RolesDetailModal } from '../../../modals/Gestion/Roles/Detail/roles-detail.modal';

type ModalMode = 'create-edit' | 'detail' | 'confirm-delete' | null;
type UserRoleContext = 'superadmin' | 'admin' | 'client' | null;

@Component({
  selector: 'gestion-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    LoaderComponent,
    RolesCreateModal,
    RolesDeleteModal,
    RolesDetailModal,
  ],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {
  private rolesService = inject(RolesService);
  private cdr = inject(ChangeDetectorRef);
  activeTab: 'users' | 'roles' | 'subroles' = 'users';
  roles: any[] = [];
  subRoles: any[] = [];
  isMobile = window.innerWidth < 640;
  rolesPage = 1;
  rolesPageSize = 10;
  subRolesPage = 1;
  subRolesPageSize = 10;
  selectedUser: GestionUser | null = null;
  selectedRole: any = null;
  modalMode: 'create-edit' | 'detail' | 'confirm-delete' | null = null;
  loading = true;
  @HostListener('window:resize')
  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      rolesResp: this.rolesService.getRoles(),
      subRolesResp: this.rolesService.getSubRoles(),
      usersResp: this.rolesService.getUsers(),
    }).subscribe({
      next: ({ rolesResp, subRolesResp }) => {
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

  onResize() {
    this.isMobile = window.innerWidth < 640;
    this.cdr.markForCheck();
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

  get visibleRolesPages(): number[] {
    const total = this.rolesTotalPages;
    const windowSize = 5;
    if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, this.rolesPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > total) {
      end = total;
      start = end - windowSize + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get visibleSubRolesPages(): number[] {
    const total = this.subRolesTotalPages;
    const windowSize = 5;
    if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, this.subRolesPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > total) {
      end = total;
      start = end - windowSize + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  openDetail(role: any) {
    this.selectedRole = role;
    this.modalMode = 'detail';
  }
  openEdit(role: any, e?: Event) {
    e?.stopPropagation();
    this.selectedRole = role;
    this.modalMode = 'create-edit';
  }
  openDeleteConfirm(role: any, e?: Event) {
    e?.stopPropagation();
    this.selectedRole = role;
    this.modalMode = 'confirm-delete';
  }
  openAdd() {
    this.selectedRole = null;
    this.modalMode = 'create-edit';
  }
  closeModal() {
    this.selectedRole = null;
    this.modalMode = null;
  }
  onSaved() {
    this.closeModal();
    this.ngOnInit();
  }
  onDeleted() {
    this.closeModal();
    this.ngOnInit();
  }
  openCreate() {
    this.selectedRole = null;
    this.modalMode = 'create-edit';
  }
}
