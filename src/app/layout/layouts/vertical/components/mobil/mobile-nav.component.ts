import { Component, ViewEncapsulation, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../../../core/user/user.service';
import { NavItem } from '../navigation/nav.type';
import { menuAdmin, menuClientes, menuColaborador, menuSeniorCoach, menuBranchManager, menuSuAdmin, menuOwner } from '../navigation/data/data';
import { RoleEnum, SubRoleEnum } from '../../../../../modules/auth/roles/dataroles';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './mobile-nav.component.html',
  styleUrls: ['./mobile-nav.component.scss'],
})
export class MobileNavComponent {
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  navigation = signal<NavItem[]>([]);
  mobileOpenGroup = signal<string | null>(null);
  mobileNavItems = computed(() => this.navigation().slice(0, 5));

  constructor() {
    this.userService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (!user) { this.navigation.set([]); return; }
      const permissions = Number(user.permissions);
      const subpermissions = user.sub_permissions ? Number(user.sub_permissions) : null;
      this.navigation.set(this.getMenuByRole(permissions, subpermissions));
    });
  }

  toggleMobileGroup(id: string) {
    this.mobileOpenGroup.update(c => c === id ? null : id);
  }

  closeMobileGroup() {
    this.mobileOpenGroup.set(null);
  }

  isMobileGroupActive(groupId: string): boolean {
    const group = this.navigation().find(i => i.id === groupId);
    if (!group?.children) return false;
    const current = window.location.pathname;
    return group.children.some(child => child.link && current.startsWith(child.link));
  }

  getMenuByRole(permissions: number, subpermissions?: number | null): NavItem[] {
    if (subpermissions) {
      switch (subpermissions) {
        case SubRoleEnum.senior_coach: return [...menuSeniorCoach];
        case SubRoleEnum.branch_manager: return [...menuBranchManager];
      }
    }
    switch (permissions) {
      case RoleEnum.superadmin: return [...menuSuAdmin];
      case RoleEnum.gym_owner: return [...menuOwner];
      case RoleEnum.admin: return [...menuAdmin];
      case RoleEnum.coach: return [...menuSeniorCoach];
      case RoleEnum.client: return [...menuClientes];
      default: return [];
    }
  }
}