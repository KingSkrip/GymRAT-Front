import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/user/user.service';
import { Roles } from '../../auth/roles/dataroles';

export interface Metric {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'info' | 'success' | 'warning' | 'danger' | 'default';
}

export interface ListItem {
  initials?: string;
  icon?: string;
  name: string;
  sub?: string;
  badge?: string;
  badgeColor?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  avatarColor?: 'info' | 'success' | 'warning' | 'danger' | 'default';
}

@Component({
  selector: 'app-cliente-membresia',
  standalone: true,
  templateUrl: './membresia.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatIconModule],
})
export class MembresiaComponent implements OnInit {
  // ─── User info ───────────────────────────────────────────────
  userName = '';
  userInitials = '';
  userRole = '';
  branchName = '';
  clMembershipActive = true;

  // ─── Client ──────────────────────────────────────────────────
  clMembershipType = '';
  clMembershipDaysLeft = 0;
  clMembershipTotal = 30;
  clMembershipStart = '';
  clMembershipEnd = '';
  clMembershipPercent = 0;
  selectedPlan = 'monthly';

  membershipPlans = [
    {
      id: 'visit',
      name: 'Visita única',
      description: 'Acceso por un día, sin compromiso',
      price: '$80',
      period: 'por visita',
      icon: 'heroicons_outline:ticket',
      popular: false,
    },
    {
      id: 'monthly',
      name: 'Mensual',
      description: 'Acceso ilimitado por 30 días',
      price: '$350',
      period: 'por mes',
      icon: 'heroicons_outline:calendar',
      popular: true,
    },
    {
      id: 'annual',
      name: 'Anual',
      description: 'Ahorra 2 meses vs mensual',
      price: '$3,500',
      period: 'por año',
      icon: 'heroicons_outline:chart-bar',
      popular: false,
    },
  ];

  constructor(private _userService: UserService) {}

  ngOnInit(): void {
    this._userService.user$.subscribe((user: any) => {
      if (!user) return;
      this.userName = user.name ?? 'Usuario';
      this.userInitials = this.getInitials(user.name ?? '');
      this.branchName = user.gym?.name ?? user.branch?.name ?? '';
      const roleId = Number(user.permissions || 5);
      this.userRole = Roles[roleId as keyof typeof Roles] ?? 'client';
      this.loadDataForRole(this.userRole);
    });
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  private loadDataForRole(role: string): void {
    this._userService.user$.subscribe((user: any) => {
      if (!user) return;

      // ── Membresía ──────────────────────────────────────────
      const membership = user?.membership;
      this.clMembershipType = membership?.type ?? 'Sin membresía';
      this.clMembershipDaysLeft = Math.max(0, Math.floor(membership?.days_left ?? 0));
      this.clMembershipActive = !!membership?.is_active;
      this.clMembershipStart = membership?.start_date ?? '';
      this.clMembershipEnd = membership?.end_date ?? '';
      this.clMembershipTotal = 30;
      this.clMembershipPercent = Math.round(
        (1 - this.clMembershipDaysLeft / this.clMembershipTotal) * 100,
      );
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────
  getMembershipAlertClass(): string {
    if (!this.clMembershipActive) {
      return 'alert-inactive';
    }
    if (this.clMembershipDaysLeft <= 3) {
      return 'alert-danger';
    }
    if (this.clMembershipDaysLeft <= 7) {
      return 'alert-warn';
    }
    return 'alert-ok';
  }

  onRenewMembership() {
    // tu lógica de pago
  }

  onViewHistory() {
    // navegar a historial
  }

  selectPlan(id: string) {
    this.selectedPlan = id;
  }
}
