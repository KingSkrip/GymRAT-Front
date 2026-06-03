import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../../core/user/user.service';
import { Roles } from '../auth/roles/dataroles';
import { MatIconModule } from '@angular/material/icon';

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

export interface ProgressItem {
  label: string;
  sub?: string;
  percent: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export interface AccessMethod {
  icon: string;
  label: string;
  active: boolean;
  comingSoon?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatIconModule],
})
export class DashboardComponent implements OnInit {
  currentYear = new Date().getFullYear();

  // ─── User info ───────────────────────────────────────────────
  userName = '';
  userInitials = '';
  userRole = '';
  branchName = '';
  clMembershipActive = true;
  clQrToken = '';
  clQrValid = false;
  clQrExpiresAt = '';
  clBiometricsRegistered = false;
  clBiometricsTotal = 0;
  clLastAccessType = '';
  clLastAccessAt = '';
  clWorkoutTitle = '';
  clWorkoutDescription = '';
  clWorkoutExercises: string[] = [];

  // ─── Tabs ────────────────────────────────────────────────────
  activeTab = 'overview';

  // ─── Superadmin ──────────────────────────────────────────────
  saMetrics: Metric[] = [];
  saChartBars: number[] = [];
  saChartLabels: string[] = [];
  saExpiringGyms: ListItem[] = [];
  saGyms: ListItem[] = [];
  saBillingMetrics: Metric[] = [];
  saBillingItems: ListItem[] = [];
  saRoleMetrics: Metric[] = [];

  // ─── Gym owner ───────────────────────────────────────────────
  goAlert: string | null = null;
  goMetrics: Metric[] = [];
  goMembershipProgress: ProgressItem[] = [];
  goBranches: ListItem[] = [];
  goClients: ListItem[] = [];
  goClientFilter = 'all';

  // ─── Admin ───────────────────────────────────────────────────
  adMetrics: Metric[] = [];
  adAccessLogs: ListItem[] = [];
  adAccessMethods: AccessMethod[] = [];
  adCoaches: ListItem[] = [];

  // ─── Coach ───────────────────────────────────────────────────
  coMetrics: Metric[] = [];
  coClients: ListItem[] = [];
  coRoutines: ListItem[] = [];
  coProgress: ProgressItem[] = [];

  // ─── Client ──────────────────────────────────────────────────
  clMembershipType = '';
  clMembershipDaysLeft = 0;
  clMembershipTotal = 30;
  clMembershipStart = '';
  clMembershipEnd = '';
  clMembershipPercent = 0;
  clStats: Metric[] = [];
  clAccessMethods: ListItem[] = [];
  clRoutineName = '';
  clRoutineWeek = 0;
  clRoutineWeekTotal = 0;
  clRoutinePercent = 0;
  clExercises: ListItem[] = [];
  constructor(
    private _authService: AuthService,
    private _userService: UserService,
  ) {}

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
    // Resetea el tab según el rol
    const defaultTab: Record<string, string> = {
      superadmin: 'overview',
      gym_owner: 'overview',
      admin: 'overview',
      coach: 'overview',
      client: 'routine',
    };
    this.activeTab = defaultTab[role] ?? 'overview';

    switch (role) {
      case 'superadmin':
        this.loadSuperadmin();
        break;
      case 'gym_owner':
        this.loadGymOwner();
        break;
      case 'admin':
        this.loadAdmin();
        break;
      case 'coach':
        this.loadCoach();
        break;
      case 'client':
        this.loadClient();
        break;
    }
  }

  // ─── Superadmin data ─────────────────────────────────────────
  private loadSuperadmin(): void {
    this.saMetrics = [
      { label: 'Gyms activos', value: 14, sub: '+2 este mes', color: 'info' },
      { label: 'Sucursales', value: 38, sub: 'total en sistema' },
      { label: 'MRR', value: '$42,800', sub: 'rentas mensuales', color: 'success' },
      { label: 'Vencimientos', value: 3, sub: 'próximos 7 días', color: 'warning' },
    ];
    this.saChartBars = [45, 55, 60, 72, 80, 100];
    this.saChartLabels = ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'];
    this.saExpiringGyms = [
      {
        icon: 'ti-building-store',
        name: 'FitZone MX',
        sub: '3 sucursales · plan mensual',
        badge: 'Vence en 2 días',
        badgeColor: 'red',
      },
      {
        icon: 'ti-building-store',
        name: 'IronBody GDL',
        sub: '1 sucursal · plan mensual',
        badge: 'Vence en 5 días',
        badgeColor: 'yellow',
      },
      {
        icon: 'ti-building-store',
        name: 'PowerHouse MTY',
        sub: '2 sucursales · plan anual',
        badge: 'Activo · 8 meses',
        badgeColor: 'green',
      },
    ];
    this.saGyms = [
      {
        icon: 'ti-building-store',
        name: 'PowerHouse MTY',
        sub: '2 sucursales · 340 clientes',
        badge: 'Al día',
        badgeColor: 'green',
      },
      {
        icon: 'ti-building-store',
        name: 'FitZone MX',
        sub: '3 sucursales · 890 clientes',
        badge: 'Por vencer',
        badgeColor: 'yellow',
      },
      {
        icon: 'ti-building-store',
        name: 'IronBody GDL',
        sub: '1 sucursal · 215 clientes',
        badge: 'Plan anual',
        badgeColor: 'blue',
      },
    ];
    this.saBillingMetrics = [
      { label: 'Cobrado este mes', value: '$42,800', color: 'success' },
      { label: 'Pendiente', value: '$6,400', color: 'warning' },
      { label: 'Vencido', value: '$3,200', color: 'danger' },
    ];
    this.saBillingItems = [
      {
        name: 'PowerHouse MTY — plan mensual',
        sub: 'Cobrado 01/05/2026',
        badge: '$4,800 pagado',
        badgeColor: 'green',
      },
      {
        name: 'FitZone MX — 3 sucursales',
        sub: 'Factura generada · vence 24/05',
        badge: '$9,600 pendiente',
        badgeColor: 'yellow',
      },
      {
        name: 'IronBody GDL — plan anual',
        sub: 'Cobrado 01/01/2026',
        badge: '$19,200 anual',
        badgeColor: 'blue',
      },
    ];
    this.saRoleMetrics = [
      { label: 'gym_owner', value: 14, sub: 'Dueños de gym', color: 'info' },
      { label: 'admin', value: 38, sub: 'Uno por sucursal' },
      { label: 'coach', value: 142, sub: 'Activos en sistema', color: 'success' },
      { label: 'client', value: 3840, sub: 'Membresías activas', color: 'warning' },
    ];
  }

  // ─── Gym owner data ──────────────────────────────────────────
  private loadGymOwner(): void {
    this.goAlert = 'Renta de FitZone MX vence en 2 días — contáctanos para renovar';
    this.goMetrics = [
      { label: 'Sucursales', value: 3, color: 'info' },
      { label: 'Clientes activos', value: 890 },
      { label: 'Coaches', value: 18, color: 'success' },
      { label: 'Memb. por vencer', value: 47, sub: 'próximos 7 días', color: 'warning' },
    ];
    this.goMembershipProgress = [
      { label: 'Mensual', sub: '520 / 890', percent: 58, color: 'blue' },
      { label: 'Anual', sub: '280 / 890', percent: 31, color: 'purple' },
      { label: 'Visita / otro', sub: '90 / 890', percent: 10, color: 'green' },
    ];
    this.goBranches = [
      {
        icon: 'ti-map-pin',
        name: 'FitZone Norte',
        sub: '340 clientes · 8 coaches',
        badge: 'Abierto',
        badgeColor: 'green',
      },
      {
        icon: 'ti-map-pin',
        name: 'FitZone Centro',
        sub: '310 clientes · 6 coaches',
        badge: 'Abierto',
        badgeColor: 'green',
      },
      {
        icon: 'ti-map-pin',
        name: 'FitZone Sur',
        sub: '240 clientes · 4 coaches',
        badge: 'Nuevo · 2 meses',
        badgeColor: 'blue',
      },
    ];
    this.goClients = [
      {
        initials: 'AL',
        name: 'Ana López',
        sub: 'Mensual · FitZone Norte',
        badge: '14 días',
        badgeColor: 'green',
        avatarColor: 'info',
      },
      {
        initials: 'JR',
        name: 'Juan Ramos',
        sub: 'Mensual · FitZone Centro',
        badge: '3 días',
        badgeColor: 'yellow',
        avatarColor: 'warning',
      },
      {
        initials: 'MG',
        name: 'Mario González',
        sub: 'Visita · FitZone Norte',
        badge: 'Vencido',
        badgeColor: 'red',
        avatarColor: 'danger',
      },
    ];
  }

  // ─── Admin data ──────────────────────────────────────────────
  private loadAdmin(): void {
    this.adMetrics = [
      { label: 'Clientes hoy', value: 87, sub: 'ingresos registrados', color: 'info' },
      { label: 'Memb. activas', value: 340 },
      { label: 'Por vencer', value: 12, sub: 'esta semana', color: 'warning' },
      { label: 'Coaches activos', value: 8, color: 'success' },
    ];
    this.adAccessLogs = [
      {
        icon: 'ti-scan',
        name: 'Ana López',
        sub: 'QR · 07:42 am',
        badge: 'OK',
        badgeColor: 'green',
      },
      {
        icon: 'ti-fingerprint',
        name: 'Carlos Peña',
        sub: 'Huella · 08:15 am',
        badge: 'OK',
        badgeColor: 'blue',
      },
      {
        icon: 'ti-scan',
        name: 'Mario González',
        sub: 'QR · 08:30 am',
        badge: 'Membresía vencida',
        badgeColor: 'red',
      },
    ];
    this.adAccessMethods = [
      { icon: 'ti-qrcode', label: 'QR Code', active: true },
      { icon: 'ti-fingerprint', label: 'Huella', active: true },
      { icon: 'ti-face-id', label: 'Face ID', active: false, comingSoon: true },
      { icon: 'ti-nfc', label: 'NFC', active: false, comingSoon: true },
    ];
    this.adCoaches = [
      {
        initials: 'LT',
        name: 'Luis Torres',
        sub: '12 clientes asignados',
        badge: 'Activo',
        badgeColor: 'green',
        avatarColor: 'success',
      },
      {
        initials: 'SV',
        name: 'Sofía Vargas',
        sub: '9 clientes asignados',
        badge: 'Activo',
        badgeColor: 'blue',
        avatarColor: 'info',
      },
    ];
  }

  // ─── Coach data ──────────────────────────────────────────────
  private loadCoach(): void {
    this.coMetrics = [
      { label: 'Mis clientes', value: 12, color: 'info' },
      { label: 'Asistieron hoy', value: 7, color: 'success' },
      { label: 'Rutinas activas', value: 12 },
    ];
    this.coClients = [
      {
        initials: 'AL',
        name: 'Ana López',
        sub: 'Semana 8 de 16 · Fuerza',
        badge: 'Asistió hoy',
        badgeColor: 'green',
        avatarColor: 'info',
      },
      {
        initials: 'PC',
        name: 'Pedro Cruz',
        sub: 'Semana 3 de 12 · Volumen',
        badge: 'Sin check-in',
        badgeColor: 'yellow',
        avatarColor: 'default',
      },
      {
        initials: 'VM',
        name: 'Valeria Mora',
        sub: 'Semana 1 de 8 · Definición',
        badge: 'Asistió hoy',
        badgeColor: 'green',
        avatarColor: 'success',
      },
    ];
    this.coRoutines = [
      {
        icon: 'ti-clipboard-list',
        name: 'Fuerza — Intermedio',
        sub: 'Ana López · 3 días/semana',
        badge: 'Semana 8',
        badgeColor: 'blue',
      },
      {
        icon: 'ti-clipboard-list',
        name: 'Volumen — Básico',
        sub: 'Pedro Cruz · 4 días/semana',
        badge: 'Semana 3',
        badgeColor: 'green',
      },
    ];
    this.coProgress = [
      { label: 'Peso corporal', sub: '-4.2 kg', percent: 70, color: 'green' },
      { label: 'Sentadilla 1RM', sub: '+15 kg', percent: 55, color: 'blue' },
      { label: 'Asistencia', sub: '85%', percent: 85, color: 'purple' },
    ];
  }

  // ─── Client data ─────────────────────────────────────────────
  private loadClient(): void {
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

      // ── QR ────────────────────────────────────────────────
      const qr = user?.qr;
      this.clQrToken = qr?.token ?? '';
      this.clQrValid = !!qr?.is_valid;
      this.clQrExpiresAt = qr?.expires_at ?? '';

      // ── Biometría ─────────────────────────────────────────
      const bio = user?.biometrics;
      this.clBiometricsRegistered = !!bio?.registered;
      this.clBiometricsTotal = bio?.total ?? 0;

      // ── Último acceso ─────────────────────────────────────
      const access = user?.last_access;
      this.clLastAccessType = access?.type ?? '';
      this.clLastAccessAt = access?.accessed_at ?? '';

      // ── Stats que se muestran en "Mi membresía" ───────────
      this.clStats = [
        {
          label: 'Último acceso',
          value: this.clLastAccessType
            ? `${this.clLastAccessType.toUpperCase()} · ${this.clLastAccessAt.substring(11, 16)}`
            : 'Sin registro',
          color: 'info',
        },
        {
          label: 'Biometría',
          value: this.clBiometricsRegistered
            ? `Registrada (${this.clBiometricsTotal})`
            : 'No registrada',
          color: this.clBiometricsRegistered ? 'success' : 'default',
        },
      ];

      // ── Métodos de acceso vinculados (tab QR) ─────────────
      this.clAccessMethods = [
        {
          icon: 'ti-qrcode',
          name: 'QR Code',
          sub: this.clQrValid
            ? `Válido · vence ${this.clQrExpiresAt.substring(0, 10)}`
            : 'QR ya utilizado o vencido',
          badge: this.clQrValid ? 'Válido' : 'Inválido',
          badgeColor: this.clQrValid ? 'green' : 'red',
        },
        {
          icon: 'ti-fingerprint',
          name: 'Huella digital',
          sub: this.clBiometricsRegistered
            ? `${this.clBiometricsTotal} huella(s) registrada(s)`
            : 'No registrada',
          badge: this.clBiometricsRegistered ? 'Registrada' : 'Pendiente',
          badgeColor: this.clBiometricsRegistered ? 'green' : 'gray',
        },
      ];

      // ── Rutina / workout ──────────────────────────────────
      const workout = user?.workout;
      this.clWorkoutTitle = workout?.title ?? 'Sin rutina asignada';
      this.clWorkoutDescription = workout?.description ?? '';
      this.clWorkoutExercises = workout?.exercises ?? [];

      this.clRoutineName = this.clWorkoutTitle;
      this.clRoutineWeek = 1;
      this.clRoutineWeekTotal = 8;
      this.clRoutinePercent = 12;

      this.clExercises = this.clWorkoutExercises.map((ex, i) => ({
        icon: 'ti-barbell',
        name: ex,
        sub: `Ejercicio ${i + 1}`,
        badge: 'Pendiente',
        badgeColor: 'gray' as const,
      }));
    });
  }
  // ─── Helpers ─────────────────────────────────────────────────
  setTab(tab: string): void {
    this.activeTab = tab;
  }

  getBadgeClass(color?: string): string {
    const map: Record<string, string> = {
      green: 'b-green',
      yellow: 'b-yellow',
      red: 'b-red',
      blue: 'b-blue',
      gray: 'b-gray',
    };
    return map[color ?? ''] ?? 'b-gray';
  }

  getAvatarBg(color?: string): string {
    const map: Record<string, string> = {
      info: 'var(--color-background-info)',
      success: 'var(--color-background-success)',
      warning: 'var(--color-background-warning)',
      danger: 'var(--color-background-danger)',
    };
    return map[color ?? ''] ?? 'var(--color-background-info)';
  }

  getAvatarColor(color?: string): string {
    const map: Record<string, string> = {
      info: 'var(--color-text-info)',
      success: 'var(--color-text-success)',
      warning: 'var(--color-text-warning)',
      danger: 'var(--color-text-danger)',
    };
    return map[color ?? ''] ?? 'var(--color-text-info)';
  }

  getMetricClass(color?: string): string {
    const map: Record<string, string> = {
      info: 'metric-val info',
      success: 'metric-val success',
      warning: 'metric-val warning',
      danger: 'metric-val danger',
    };
    return map[color ?? ''] ?? 'metric-val';
  }

  getProgressClass(color?: string): string {
    const map: Record<string, string> = {
      blue: 'fill-blue',
      green: 'fill-green',
      yellow: 'fill-yellow',
      red: 'fill-red',
      purple: 'fill-purple',
    };
    return map[color ?? ''] ?? 'fill-blue';
  }

  getMembershipAlertClass(): string {
    // 🚨 si la suscripción del gym/cliente está inactiva
    if (!this.clMembershipActive) {
      return 'alert-inactive';
    }

    // ❌ NO validar membresía aquí
    // aunque tenga 0 días no mostrar inactiva

    // último aviso
    if (this.clMembershipDaysLeft <= 3) {
      return 'alert-danger';
    }

    // próxima a vencer
    if (this.clMembershipDaysLeft <= 7) {
      return 'alert-warn';
    }

    return 'alert-ok';
  }

  getBarColor(i: number, total: number): string {
    return i === total - 1 ? '#7c3aed' : 'var(--color-background-info)';
  }

  getBarOpacity(i: number, total: number): string {
    return i === total - 1 ? '1' : '0.7';
  }
}
