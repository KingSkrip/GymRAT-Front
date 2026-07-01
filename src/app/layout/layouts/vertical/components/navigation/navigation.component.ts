import { Component, ViewEncapsulation, signal, inject, OnInit, DestroyRef, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VerticalLayoutService } from '../services/vertical-layout.service';
import { UserService } from '../../../../../core/user/user.service';
import { NavItem } from './nav.type';
import {
  menuAdmin,
  menuBranchManager,
  menuClientes,
  menuColaborador,
  menuOwner,
  menuSeniorCoach,
  menuSuAdmin,
} from './data/data';
import { RoleEnum, SubRoleEnum } from '../../../../../modules/auth/roles/dataroles';

// Cuántos ítems mostrar en el bottom nav (el resto se omite o agrupa)
const MOBILE_NAV_MAX = 5;

@Component({
  selector: 'app-navigation',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  imports: [RouterLink, RouterLinkActive, MatIconModule],
})
export class NavigationComponent implements OnInit {
  expandedGroups = signal<string[]>([]);
  navigation = signal<NavItem[]>([]);

  // ID del grupo abierto en móvil (bottom sheet)
  mobileOpenGroup = signal<string | null>(null);

  // Solo los primeros N ítems para el bottom nav
  mobileNavItems = computed(() => this.navigation().slice(0, MOBILE_NAV_MAX));

  layoutService = inject(VerticalLayoutService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.userService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (!user) {
        this.navigation.set([]);
        return;
      }

      const permissions = Number(user.permissions);
      const subpermissions = user.sub_permissions ? Number(user.sub_permissions) : null;

      this.navigation.set(this.getMenuByRole(permissions, subpermissions));
    });
  }

  // ── Desktop group logic ──────────────────────────────────────────

  toggleGroup(groupId: string): void {
    const groups = this.expandedGroups();
    if (groups.includes(groupId)) {
      this.expandedGroups.set(groups.filter((id) => id !== groupId));
      return;
    }
    this.expandedGroups.set([...groups, groupId]);
  }

  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups().includes(groupId);
  }

  // ── Mobile group logic (bottom sheet) ───────────────────────────

  toggleMobileGroup(groupId: string): void {
    this.mobileOpenGroup.update((current) => (current === groupId ? null : groupId));
  }

  closeMobileGroup(): void {
    this.mobileOpenGroup.set(null);
  }

  /** Marca el botón de grupo como activo si algún hijo está activo */
  isMobileGroupActive(groupId: string): boolean {
    const group = this.navigation().find((i) => i.id === groupId);
    if (!group?.children) return false;
    // RouterLinkActive no aplica en botones, así que chequeamos la URL
    const current = window.location.pathname;
    return group.children.some((child) => child.link && current.startsWith(child.link));
  }

  // ── Role menu ────────────────────────────────────────────────────

  getMenuByRole(permissions: number, subpermissions?: number | null): NavItem[] {
    if (subpermissions) {
      switch (subpermissions) {
        case SubRoleEnum.senior_coach:
          return [...menuSeniorCoach];
        case SubRoleEnum.branch_manager:
          return [...menuBranchManager];
      }
    }

    switch (permissions) {
      case RoleEnum.superadmin:
        return [...menuSuAdmin];
      case RoleEnum.gym_owner:
        return [...menuOwner];
      case RoleEnum.admin:
        return [...menuAdmin];
      case RoleEnum.coach:
        return [...menuSeniorCoach];
      case RoleEnum.client:
        return [...menuClientes];
      default:
        return [];
    }
  }
}