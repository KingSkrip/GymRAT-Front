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

import { Gym, GymBranch, GymsService } from '../../../Suadmin/Gyms/gyms.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'gymdetails-modal',
  standalone: true,
  templateUrl: './gyms-detailsmodal.component.html',
  styleUrls: ['./gyms-detailsmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class GymDetailsModalComponent implements OnInit, OnDestroy {
  @Input() gym!: Gym;

  @Output() closed = new EventEmitter<void>();
  @Output() gymUpdated = new EventEmitter<Gym>();
  @Output() openEdit = new EventEmitter<Gym>();
  @Output() openToggle = new EventEmitter<Gym>();
  @Output() openDelete = new EventEmitter<Gym>();

  selectedGym!: Gym;

  showBranchForm = false;
  savingBranch = false;
  editingBranch: GymBranch | null = null;
  newBranch: Partial<GymBranch> = { name: '', address: '', phone: '' };

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  private destroy$ = new Subject<void>();
  private svc = inject(GymsService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.selectedGym = { ...this.gym };

    this.svc
      .getOne(this.gym.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.selectedGym = { ...res.data };
          this.gymUpdated.emit(this.selectedGym);
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Branches ──────────────────────────────────────────────────────────

  startAddBranch(): void {
    this.showBranchForm = true;
    this.editingBranch = null;
  }

  cancelAddBranch(): void {
    this.showBranchForm = false;
    this.newBranch = { name: '', address: '', phone: '' };
  }

  saveNewBranch(): void {
    if (!this.newBranch.name) return;
    this.savingBranch = true;
    this.svc
      .storeBranch(this.selectedGym.id, this.newBranch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (branch) => {
          this.zone.run(() => {
            this.selectedGym.branches = [...(this.selectedGym.branches ?? []), branch];
            this.selectedGym.branch_count++;
            this.cancelAddBranch();
            this.savingBranch = false;
            this.gymUpdated.emit(this.selectedGym);
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.savingBranch = false;
        },
      });
  }

  startEditBranch(branch: GymBranch): void {
    this.editingBranch = { ...branch };
    this.showBranchForm = false;
  }

  cancelEditBranch(): void {
    this.editingBranch = null;
  }

  saveEditBranch(): void {
    if (!this.editingBranch) return;
    this.savingBranch = true;
    this.svc
      .updateBranch(this.selectedGym.id, this.editingBranch.id, this.editingBranch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.zone.run(() => {
            const idx = this.selectedGym.branches!.findIndex((b) => b.id === updated.id);
            if (idx !== -1) this.selectedGym.branches![idx] = updated;
            this.editingBranch = null;
            this.savingBranch = false;
            this.gymUpdated.emit(this.selectedGym);
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.savingBranch = false;
        },
      });
  }

  deleteBranch(branch: GymBranch): void {
    this.svc
      .deleteBranch(this.selectedGym.id, branch.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.selectedGym.branches = this.selectedGym.branches!.filter(
              (b) => b.id !== branch.id,
            );
            this.selectedGym.branch_count--;
            this.gymUpdated.emit(this.selectedGym);
            this.cdr.markForCheck();
          });
        },
      });
  }

  // ── Drawer touch ──────────────────────────────────────────────────────

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
