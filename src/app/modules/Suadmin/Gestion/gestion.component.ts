import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesService } from './gestion.service';

@Component({
  selector: 'suadmin-gestion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestion.component.html',
})
export class GestionComponent implements OnInit {
  private rolesService = inject(RolesService);
  activeTab: 'users' | 'roles' | 'subroles' = 'users';

  roles: any[] = [];
  subRoles: any[] = [];
  users: any[] = [];

  // Paginado roles
  rolesPage = 1;
  rolesPageSize = 10;

  // Paginado subroles
  subRolesPage = 1;
  subRolesPageSize = 10;

  // Paginado usuarios
  usersPage = 1;
  usersPageSize = 10;

  get pagedRoles(): any[] {
    const start = (this.rolesPage - 1) * this.rolesPageSize;
    return this.roles.slice(start, start + this.rolesPageSize);
  }

  get rolesTotalPages(): number[] {
    const total = Math.ceil(this.roles.length / this.rolesPageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  get pagedSubRoles(): any[] {
    const start = (this.subRolesPage - 1) * this.subRolesPageSize;
    return this.subRoles.slice(start, start + this.subRolesPageSize);
  }

  get subRolesTotalPages(): number[] {
    const total = Math.ceil(this.subRoles.length / this.subRolesPageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  get pagedUsers(): any[] {
    const start = (this.usersPage - 1) * this.usersPageSize;
    return this.users.slice(start, start + this.usersPageSize);
  }

  get usersTotalPages(): number[] {
    const total = Math.ceil(this.users.length / this.usersPageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  ngOnInit(): void {
    this.loadData();
    this.loadUsers();
  }

  loadData(): void {
    this.rolesService.getRoles().subscribe({
      next: (resp) => {
        this.roles = resp.roles ?? [];
        this.subRoles = resp.sub_roles ?? [];
        this.rolesPage = 1;
        this.subRolesPage = 1;
      },
      error: (err) => console.error(err),
    });
  }

  loadUsers(): void {
    this.rolesService.getUsers().subscribe({
      next: (resp) => {
        this.users = resp.users ?? [];
        this.usersPage = 1;
      },
      error: (err) => console.error(err),
    });
  }
}