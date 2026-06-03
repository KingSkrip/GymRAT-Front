import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GymsService, GymItem, GymBranch } from './gyms.service';
import { UserService } from '../../../core/user/user.service';
import { filter, switchMap, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-suadmin-gyms',
  standalone: true,
  templateUrl: './gyms.component.html',
  encapsulation: ViewEncapsulation.None,
   imports: [CommonModule, MatIconModule, FormsModule], 
})
export class GymsComponent implements OnInit {
  saGyms: GymItem[] = [];
  loading = true;
  error: string | null = null;

  // ─── Detail panel ────────────────────────────────────────────
  selectedGym: GymItem | null = null;
  gymPanelStartY = 0;
  gymPanelDeltaY = 0;
  gymPanelDragging = false;

  showBranchForm = false;
  savingBranch = false;
  newBranch: Partial<GymBranch> = { name: '', address: '', phone: '' };
  editingBranch: GymBranch | null = null;

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private _gymsService: GymsService,
    private _userService: UserService,
  ) {}

  ngOnInit(): void {
    this._userService.user$
      .pipe(
        filter((user) => !!user),
        take(1),
        switchMap(() => this._gymsService.getGyms()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.saGyms = res.items;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Error al cargar gyms';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
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

  openGymDetail(item: GymItem): void {
    this.selectedGym = item;
  }

  closeGymDetail(): void {
    this.selectedGym = null;
    this.gymPanelDeltaY = 0;
  }

  onPanelTouchStart(e: TouchEvent): void {
    this.gymPanelStartY = e.touches[0].clientY;
    this.gymPanelDeltaY = 0;
    this.gymPanelDragging = true;
  }

  onPanelTouchMove(e: TouchEvent): void {
    if (!this.gymPanelDragging) return;
    this.gymPanelDeltaY = Math.max(0, e.touches[0].clientY - this.gymPanelStartY);
  }

  onPanelTouchEnd(): void {
    this.gymPanelDragging = false;
    if (this.gymPanelDeltaY > 80) {
      this.closeGymDetail();
    } else {
      this.gymPanelDeltaY = 0;
    }
  }

  // Métodos nuevos:
  startAddBranch(): void {
    this.showBranchForm = true;
    this.editingBranch = null;
  }

  cancelAddBranch(): void {
    this.showBranchForm = false;
    this.newBranch = { name: '', address: '', phone: '' };
  }

  saveNewBranch(): void {
    if (!this.selectedGym || !this.newBranch.name) return;
    this.savingBranch = true;
    this._gymsService.storeBranch(this.selectedGym.id, this.newBranch).subscribe({
      next: (branch) => {
        this.selectedGym!.branches.push({ ...branch });
        this.cancelAddBranch();
        this.savingBranch = false;
        this.cdr.detectChanges();
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

  cancelEdit(): void {
    this.editingBranch = null;
  }

  saveBranch(): void {
    if (!this.selectedGym || !this.editingBranch) return;
    this.savingBranch = true;
    this._gymsService
      .updateBranch(this.selectedGym.id, this.editingBranch.id, this.editingBranch)
      .subscribe({
        next: (updated) => {
          const idx = this.selectedGym!.branches.findIndex((b) => b.id === updated.id);
          if (idx !== -1) this.selectedGym!.branches[idx] = updated;
          this.editingBranch = null;
          this.savingBranch = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.savingBranch = false;
        },
      });
  }
}
