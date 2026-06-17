import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';

import {
  GymsService,
  Gym,
  GymMetrics,
  GymFilters,
  GymPayload,
  GymBranch,
  ClientOption,
} from './gyms.service';
import { GymFormModalComponent } from '../../modals/Gyms/GymForm/gym-form-modal.component';
import { GymDetailsModalComponent } from '../../modals/Gyms/Details/gyms-detailsmodal.component';
import { GymLockModalComponent } from '../../modals/Gyms/lock/gyms-lockmodal.component';
import { GymDeleteConfirmModalComponent } from '../../modals/Gyms/GymDelete/gym-delete-confirm-modal.component';



type FilterStatus = '' | 'active' | 'inactive';
type ModalMode = 'create' | 'edit' | 'detail' | 'confirm-toggle' | 'confirm-delete';

@Component({
  selector: 'app-suadmin-gyms',
  standalone: true,
  templateUrl: './gyms.component.html',
  styleUrls: ['./gyms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    GymFormModalComponent,
    GymDetailsModalComponent,
    GymLockModalComponent,
    GymDeleteConfirmModalComponent,
  ],
})
export class GymsComponent implements OnInit, OnDestroy {
  gyms: Gym[] = [];
  metrics: GymMetrics | null = null;
  loading = true;
  error: string | null = null;
  clientOptions: ClientOption[] = [];
  activeFilter: FilterStatus = '';
  searchTerm = '';
  modalMode: ModalMode | null = null;
  selectedGym: Gym | null = null;

  readonly filterPills: { label: string; value: FilterStatus; metric: keyof GymMetrics }[] = [
    { label: 'Todos', value: '', metric: 'total' },
    { label: 'Activos', value: 'active', metric: 'active' },
    { label: 'Inactivos', value: 'inactive', metric: 'inactive' },
  ];

  currentPage = 1;
  itemsPerPage = 6;

  private destroy$ = new Subject<void>();
  private load$ = new Subject<GymFilters>();
  private search$ = new Subject<string>();
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private svc = inject(GymsService);

  ngOnInit(): void {
    this.svc
      .getClientsList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.clientOptions = res.data;
          this.cdr.markForCheck();
        },
      });

    this.load$
      .pipe(
        switchMap((filters) => {
          this.loading = true;
          this.error = null;
          this.gyms = [];
          this.cdr.markForCheck();

          return this.svc.getAll(filters).pipe(
            catchError(() => {
              this.error = 'No se pudo cargar la lista de gyms.';
              this.loading = false;
              this.cdr.markForCheck();
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (!res) return;
        this.gyms = [...res.data];
        this.metrics = { ...res.metrics };
        this.currentPage = 1;
        this.loading = false;
        this.cdr.markForCheck();
      });

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.triggerLoad());

    this.triggerLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerLoad(): void {
    const filters: GymFilters = {
      status: this.activeFilter || undefined,
      search: this.searchTerm || undefined,
    };
    this.loading = true;
    this.cdr.markForCheck();
    this.load$.next(filters);
  }

  setFilter(value: FilterStatus): void {
    this.activeFilter = value;
    this.triggerLoad();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  // ── Modal openers ─────────────────────────────────────────────────────

  openCreate(): void {
    this.selectedGym = null;
    this.modalMode = 'create';
    this.cdr.markForCheck();
  }

  openEdit(g: Gym, event?: Event): void {
    event?.stopPropagation();
    this.selectedGym = g;
    this.modalMode = 'edit';
    this.cdr.markForCheck();
  }

  openDetail(g: Gym): void {
    this.selectedGym = g;
    this.modalMode = 'detail';
    this.cdr.markForCheck();
  }

  openToggleConfirm(g: Gym, event?: Event): void {
    event?.stopPropagation();
    this.selectedGym = g;
    this.modalMode = 'confirm-toggle';
    this.cdr.markForCheck();
  }

  openDeleteConfirm(g: Gym, event?: Event): void {
    event?.stopPropagation();
    this.selectedGym = g;
    this.modalMode = 'confirm-delete';
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedGym = null;
    this.cdr.markForCheck();
  }

  // ── Event handlers from child modals ─────────────────────────────────

  onSaved(): void {
    this.closeModal();
    this.triggerLoad();
  }

  onDetailGymUpdated(gym: Gym): void {
    this.selectedGym = gym;
    this.cdr.markForCheck();
  }

  onDetailOpenEdit(gym: Gym): void {
    this.openEdit(gym);
  }

  onDetailOpenToggle(gym: Gym): void {
    this.openToggleConfirm(gym);
  }

  onDetailOpenDelete(gym: Gym): void {
    this.openDeleteConfirm(gym);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  getMetricValue(key: keyof GymMetrics): number {
    return this.metrics?.[key] ?? 0;
  }

  trackById(_: number, item: Gym): number {
    return item.id;
  }

  get totalPages(): number {
    return Math.ceil(this.gyms.length / this.itemsPerPage);
  }

  get paginatedGyms(): Gym[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.gyms.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.markForCheck();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.markForCheck();
    }
  }
}