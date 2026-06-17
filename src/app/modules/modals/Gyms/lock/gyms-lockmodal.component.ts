import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Gym, GymsService } from '../../../Suadmin/Gyms/gyms.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'gymlock-modal',
  standalone: true,
  templateUrl: './gyms-lockmodal.component.html',
  styleUrls: ['./gyms-lockmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class GymLockModalComponent implements OnDestroy {
  @Input() gym!: Gym;
 
  @Output() closed = new EventEmitter<void>();
  @Output() toggled = new EventEmitter<void>();
 
  saving = false;
 
  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;
 
  private destroy$ = new Subject<void>();
  private svc = inject(GymsService);
  private cdr = inject(ChangeDetectorRef);
 
  get isDeactivate(): boolean {
    return !!this.gym?.is_active;
  }
 
  confirm(): void {
    this.saving = true;
    this.cdr.markForCheck();
 
    this.svc
      .toggle(this.gym.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.toggled.emit();
        },
        error: () => {
          this.saving = false;
          this.cdr.markForCheck();
        },
      });
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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