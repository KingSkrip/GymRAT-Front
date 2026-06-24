import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RolesService, ClientGymGroup, GestionUser } from './gestion.service';
import { forkJoin } from 'rxjs';
import { UsuariosComponent } from '../../Tabs/Gestion/Usuarios/usuarios.component';
import { SubrolesComponent } from '../../Tabs/Gestion/Subroles/subroles.component';
import { RolesComponent } from '../../Tabs/Gestion/Roles/roles.component';

type ModalMode = 'create-edit' | 'detail' | 'confirm-delete' | null;
type UserRoleContext = 'superadmin' | 'admin' | 'client' | null;

@Component({
  selector: 'suadmin-gestion',
  standalone: true,
  imports: [CommonModule, MatIconModule, UsuariosComponent, SubrolesComponent, RolesComponent],
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
  ngOnInit(): void { 
    
  }

  onResize() {
    this.isMobile = window.innerWidth < 640;
    this.cdr.markForCheck();
  }

  // ── Superadmins ──

  // ── Admins ──

  // ── Clientes ──

  // ── Roles / SubRoles ──
}
