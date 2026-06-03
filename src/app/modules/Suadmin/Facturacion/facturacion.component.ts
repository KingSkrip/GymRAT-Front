import { Component, DestroyRef, inject, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FacturacionService, BillingMetric, BillingItem } from './facturacion.service';
import { UserService } from '../../../core/user/user.service';
import { filter, switchMap, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-suadmin-facturacion',
  standalone: true,
  templateUrl: './facturacion.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatIconModule],
})
export class FacturacionComponent implements OnInit {
  saBillingMetrics: BillingMetric[] = [];
  saBillingItems: BillingItem[]     = [];
  loading = true;
  error: string | null = null;

  // ─── Detail panel ────────────────────────────────────────────
  selectedItem: BillingItem | null = null;
  panelStartY  = 0;
  panelDeltaY  = 0;
  panelDragging = false;

  private destroyRef = inject(DestroyRef);
  private cdr        = inject(ChangeDetectorRef);

  constructor(
    private _facturacionService: FacturacionService,
    private _userService: UserService,
  ) {}

  ngOnInit(): void {
    this._userService.user$
      .pipe(
        filter(user => !!user),
        take(1),
        switchMap(() => this._facturacionService.getBilling()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.saBillingMetrics = res.metrics;
          this.saBillingItems   = res.items;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Error al cargar facturación';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ─── Detail panel ────────────────────────────────────────────
  openDetail(item: BillingItem): void { this.selectedItem = item; }

  closeDetail(): void {
    this.selectedItem = null;
    this.panelDeltaY  = 0;
  }

  onPanelTouchStart(e: TouchEvent): void {
    this.panelStartY  = e.touches[0].clientY;
    this.panelDeltaY  = 0;
    this.panelDragging = true;
  }

  onPanelTouchMove(e: TouchEvent): void {
    if (!this.panelDragging) return;
    this.panelDeltaY = Math.max(0, e.touches[0].clientY - this.panelStartY);
  }

  onPanelTouchEnd(): void {
    this.panelDragging = false;
    if (this.panelDeltaY > 80) { this.closeDetail(); }
    else { this.panelDeltaY = 0; }
  }

  // ─── Helpers ─────────────────────────────────────────────────
  getMetricClass(color?: string): string {
    const map: Record<string, string> = {
      info:    'metric-val info',
      success: 'metric-val success',
      warning: 'metric-val warning',
      danger:  'metric-val danger',
    };
    return map[color ?? ''] ?? 'metric-val';
  }

  getBadgeClass(color?: string): string {
    const map: Record<string, string> = {
      green:  'b-green',
      yellow: 'b-yellow',
      red:    'b-red',
      blue:   'b-blue',
      gray:   'b-gray',
    };
    return map[color ?? ''] ?? 'b-gray';
  }
}