import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Gym, GymsService } from '../../../Suadmin/Gyms/gyms.service';



@Component({
  selector: 'app-gym-delete-confirm-modal',
  standalone: true,
  templateUrl: './gym-delete-confirm-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class GymDeleteConfirmModalComponent implements OnDestroy {
  @Input() gym!: Gym;

  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  saving = false;

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  private destroy$ = new Subject<void>();
  private svc = inject(GymsService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  confirm(): void {
    this.saving = true;
    this.svc
      .delete(this.gym.id)
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