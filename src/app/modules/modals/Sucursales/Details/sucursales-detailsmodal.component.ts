import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, Sucursal } from '../../../Suadmin/Sucursales/sucursales.service';

@Component({
  selector: 'sucursalesdetails-modal',
  standalone: true,
  templateUrl: './sucursales-detailsmodal.component.html',
  styleUrls: ['./sucursales-detailsmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class SucursalesDetailsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) sucursal!: Sucursal;

  @Output() closed = new EventEmitter<void>();
  @Output() editSucursal = new EventEmitter<Sucursal>();
  @Output() toggleSucursal = new EventEmitter<Sucursal>();
  @Output() deleteSucursal = new EventEmitter<Sucursal>();
  @Output() addSubscription = new EventEmitter<void>();
  @Output() editSubscription = new EventEmitter<Subscription>();
  @Output() addPayment = new EventEmitter<Subscription>();

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  planLabel(plan: string): string {
    return { monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual' }[plan] ?? plan;
  }

  paymentStatusLabel(status: string): string {
    return (
      { paid: 'Pagado', pending: 'Pendiente', failed: 'Fallido', cancelled: 'Cancelado' }[
        status
      ] ?? status
    );
  }

  paymentStatusColor(status: string): string {
    return { paid: 'green', pending: 'yellow', failed: 'red', cancelled: 'gray' }[status] ?? 'gray';
  }

  daysLeftLabel(days: number | null): string {
    if (days === null) return '—';
    if (days < 0) return `Venció hace ${Math.abs(days)}d`;
    if (days === 0) return 'Vence hoy';
    return `${days} día${days === 1 ? '' : 's'} restante${days === 1 ? '' : 's'}`;
  }

  onDrawerTouchStart(e: TouchEvent): void {
    this.drawerStartY = e.touches[0].clientY;
    this.drawerDeltaY = 0;
    this.drawerDragging = true;
  }

  onDrawerTouchMove(e: TouchEvent): void {
    if (!this.drawerDragging) return;
    this.drawerDeltaY = Math.max(0, e.touches[0].clientY - this.drawerStartY);
  }

  onDrawerTouchEnd(): void {
    this.drawerDragging = false;
    if (this.drawerDeltaY > 90) this.closed.emit();
    else this.drawerDeltaY = 0;
  }
}