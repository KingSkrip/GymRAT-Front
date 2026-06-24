import { Component, OnInit, inject, ChangeDetectorRef, HostListener, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { GestionUser, RolesService } from '../../../Suadmin/Gestion/gestion.service';
import { LoaderComponent } from '../../../../layout/layouts/loader/loader.component';
import { SubrolesCreateModal } from '../../../modals/Gestion/Subroles/Create/subroles-create.modal';
import { SubrolesDetailModal } from '../../../modals/Gestion/Subroles/Detail/subroles-detail.modal';
import { SubrolesDeleteModal } from '../../../modals/Gestion/Subroles/Delete/subroles-delete.modal';
import { EventEmitter } from '@angular/core';


type ModalMode = 'create-edit' | 'detail' | 'confirm-delete' | null;

@Component({
  selector: 'gestion-subroles',
  standalone: true,
  imports: [CommonModule, MatIconModule, LoaderComponent,
    SubrolesCreateModal, SubrolesDetailModal, SubrolesDeleteModal],
  templateUrl: './subroles.component.html',
})
export class SubrolesComponent implements OnInit {
  private rolesService = inject(RolesService);
  private cdr = inject(ChangeDetectorRef);

  roles: any[] = [];
  subRoles: any[] = [];
  isMobile = window.innerWidth < 640;
  subRolesPage = 1;
  subRolesPageSize = 10;
  selectedSubRole: any | null = null;
  modalMode: ModalMode = null;
  loading = true;


  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 640;
    this.cdr.markForCheck();
  }

  get pagedSubRoles() {
    const start = (this.subRolesPage - 1) * this.subRolesPageSize;
    return this.subRoles.slice(start, start + this.subRolesPageSize);
  }
  get subRolesTotalPages() {
    return Math.ceil(this.subRoles.length / this.subRolesPageSize);
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

  min(a: number, b: number) { return Math.min(a, b); }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      rolesResp: this.rolesService.getRoles(),
      subRolesResp: this.rolesService.getSubRoles(),
    }).subscribe({
      next: ({ rolesResp, subRolesResp }) => {
        this.roles = rolesResp.roles ?? [];
        this.subRoles = subRolesResp.sub_roles ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { this.loading = false; console.error(err); },
    });
  }

  openCreate() {
    this.selectedSubRole = null;
    this.modalMode = 'create-edit';
  }

  openDetail(subRole: any) {
    this.selectedSubRole = subRole;
    this.modalMode = 'detail';
  }

  openEdit(subRole: any, event?: Event) {
    event?.stopPropagation();
    this.selectedSubRole = subRole;
    this.modalMode = 'create-edit';
  }

  openDeleteConfirm(subRole: any, event?: Event) {
    event?.stopPropagation();
    this.selectedSubRole = subRole;
    this.modalMode = 'confirm-delete';
  }

  closeModal() { this.modalMode = null; this.selectedSubRole = null; }

  onSaved() { this.closeModal(); this.loadData(); }

  onDeleted() { this.closeModal(); this.loadData(); }
}