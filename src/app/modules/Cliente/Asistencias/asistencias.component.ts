import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/user/user.service';
import { Roles } from '../../auth/roles/dataroles';
import html2canvas from 'html2canvas';
import { QRCodeComponent } from 'angularx-qrcode';
import { take } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

export interface AccessLog {
  type: 'entrada' | 'salida';
  method: 'qr' | 'huella';
  at: string;
}

export interface AccessSession {
  date: string;
  entrada?: AccessLog;
  salida?: AccessLog;
}

@Component({
  selector: 'app-cliente-asistencias',
  standalone: true,
  templateUrl: './asistencias.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, QRCodeComponent, MatIconModule ],
})
export class AsistenciasComponent implements OnInit {
  @ViewChild('qrCard') qrCard!: ElementRef;

  // ─── User info ───────────────────────────────────────────────
  userName = '';
  userRole = '';
  branchName = '';
  today = new Date();

  // ─── Client ──────────────────────────────────────────────────
  clMembershipType = '';
  clMembershipActive = true;
  clQrToken = '';
  clQrValid = false;
  clQrExpiresAt = '';
  clQrScannedAt = '';
  clQrGeneratedAt = '';
  clBiometricsRegistered = false;
  clBiometricsTotal = 0;
  showQrOverlay = true;
  showQrFullscreen = false;
  clAccessSessions: AccessSession[] = [];

  constructor(private _userService: UserService) {}

  ngOnInit(): void {
    this._userService.user$.subscribe((user: any) => {
      if (!user) return;
      this.userName = user.name ?? 'Usuario';
      this.branchName = user.gym?.name ?? user.branch?.name ?? '';
      const roleId = Number(user.permissions || 5);
      this.userRole = Roles[roleId as keyof typeof Roles] ?? 'client';
      this.loadData(user);
    });
  }

  private loadData(user: any): void {
    // ── Membresía ──────────────────────────────────────────
    const membership = user?.membership;
    this.clMembershipType = membership?.type ?? 'Sin membresía';
    this.clMembershipActive = !!membership?.is_active;

    // ── QR ────────────────────────────────────────────────
    const qr = user?.qr;
    const userActive = user?.is_active !== false;
    this.clQrValid = this.clMembershipActive && userActive;
    this.clQrToken = qr?.token ?? crypto.randomUUID();
    this.clQrExpiresAt = qr?.expires_at ?? '';
    this.clQrGeneratedAt = new Date().toISOString();
    this.showQrOverlay = !this.clQrValid;

    // ── Biometría ─────────────────────────────────────────
    const bio = user?.biometrics;
    this.clBiometricsRegistered = !!bio?.registered;
    this.clBiometricsTotal = bio?.total ?? 0;

    // ── Sesiones de acceso ─────────────────────────────────
    this.buildSessions(user);
  }

  openQrFullscreen(): void {
    this.showQrFullscreen = true;
  }

  closeQrFullscreen(): void {
    this.showQrFullscreen = false;
  }

  async saveQr(): Promise<void> {
    if (!this.qrCard) return;
    const canvas = await html2canvas(this.qrCard.nativeElement, {
      backgroundColor: null,
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  private buildSessions(user: any): void {
    const sessions = user?.access_sessions ?? [];
    this.clAccessSessions = sessions.map((s: any) => ({
      date: s.date,
      entrada: s.entrada
        ? { type: 'entrada' as const, method: s.entrada.method as 'qr' | 'huella', at: s.entrada.at }
        : undefined,
      salida: s.salida
        ? { type: 'salida' as const, method: s.salida.method as 'qr' | 'huella', at: s.salida.at }
        : undefined,
    }));
  }
}