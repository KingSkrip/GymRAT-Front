import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { Sucursal, SucursalesService } from '../../../Suadmin/Sucursales/sucursales.service';

@Component({
  selector: 'sucursalesdelete-modal',
  standalone: true,
  templateUrl: './sucursales-deletemodal.component.html',
  styleUrls: ['./sucursales-deletemodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class SucursalesDeleteComponent implements OnInit, OnDestroy {
  @Input({ required: true }) sucursal!: Sucursal;

  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  saving = false;

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  private destroy$ = new Subject<void>();
  private svc = inject(SucursalesService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  confirm(): void {
    if (!this.sucursal) return;
    this.saving = true;
    this.cdr.markForCheck();

    this.svc
      .delete(this.sucursal.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.saving = false;
            this.deleted.emit();
          });
        },
        error: () => {
          this.zone.run(() => {
            this.saving = false;
            this.cdr.markForCheck();
          });
        },
      });
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