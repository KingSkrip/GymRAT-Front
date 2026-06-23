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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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

import { MisGymsService, Gym, GymMetrics, GymFilters, ClientOption } from './misgyms.service';
import { GymFormModalComponent } from '../../modals/Gyms/GymForm/gym-form-modal.component';
import { GymDetailsModalComponent } from '../../modals/Gyms/Details/gyms-detailsmodal.component';
import { GymLockModalComponent } from '../../modals/Gyms/lock/gyms-lockmodal.component';
import { GymDeleteConfirmModalComponent } from '../../modals/Gyms/GymDelete/gym-delete-confirm-modal.component';
import { GymsService } from '../../Suadmin/Gyms/gyms.service';

type FilterStatus = '' | 'active' | 'inactive';
type ModalMode = 'create' | 'edit' | 'detail' | 'confirm-toggle' | 'confirm-delete';

@Component({
  selector: 'app-owner-misgyms',
  standalone: true,
  templateUrl: './misgyms.component.html',
  styleUrls: ['./misgyms.component.scss'],
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
export class MisGymsComponent implements OnInit, OnDestroy {
  // ── Estado ────────────────────────────────────────────────────────────
  gyms: Gym[] = [];
  metrics: GymMetrics | null = null;
  loading = true;
  error: string | null = null;
  clientOptions: ClientOption[] = [];

  // ── Filtros ───────────────────────────────────────────────────────────
  activeFilter: FilterStatus = '';
  searchTerm = '';

  // ── Modales ───────────────────────────────────────────────────────────
  modalMode: ModalMode | null = null;
  selectedGym: Gym | null = null;

  // ── Paginación ────────────────────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 6;

  readonly filterPills: { label: string; value: FilterStatus; metric: keyof GymMetrics }[] = [
    { label: 'Todos', value: '', metric: 'total' },
    { label: 'Activos', value: 'active', metric: 'active' },
    { label: 'Inactivos', value: 'inactive', metric: 'inactive' },
  ];

  // ── Inyecciones ───────────────────────────────────────────────────────
  private destroy$ = new Subject<void>();
  private load$ = new Subject<GymFilters>();
  private search$ = new Subject<string>();
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private svc = inject(GymsService);

  // ── Resize handler ────────────────────────────────────────────────────
  private resizeHandler = (): void => {
    this.zone.run(() => {
      this.calculateItemsPerPage();
      this.currentPage = 1;
      this.cdr.markForCheck();
    });
  };

  // ─────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.calculateItemsPerPage();
    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', this.resizeHandler);
    });

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
    window.removeEventListener('resize', this.resizeHandler);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Cálculo dinámico de items por página
  // ─────────────────────────────────────────────────────────────────────

  private calculateItemsPerPage(): void {
    const viewportH = window.innerHeight;
    const mobile = window.innerWidth < 768;

    if (mobile) {
      const reservedH = 220;
      const cardH = 90;

      this.itemsPerPage = Math.max(1, Math.floor((viewportH - reservedH) / cardH));
    } else {
      const reservedH = 300; // antes 250
      const cardH = 130; // antes 175

      const cols = window.innerWidth >= 1024 ? 3 : 2;

      const rows = Math.max(1, Math.floor((viewportH - reservedH) / cardH));

      this.itemsPerPage = rows * cols;
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Carga de datos
  // ─────────────────────────────────────────────────────────────────────

  private triggerLoad(): void {
    const filters: GymFilters = {
      status: this.activeFilter || undefined,
      search: this.searchTerm || undefined,
    };
    this.loading = true;
    this.cdr.markForCheck();
    this.load$.next(filters);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Filtros y búsqueda
  // ─────────────────────────────────────────────────────────────────────

  setFilter(value: FilterStatus): void {
    this.activeFilter = value;
    this.triggerLoad();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  getMetricValue(key: keyof GymMetrics): number {
    return this.metrics?.[key] ?? 0;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Apertura de modales
  // ─────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────
  // Cierre de modales
  // ─────────────────────────────────────────────────────────────────────

  closeModal(): void {
    this.modalMode = null;
    this.selectedGym = null;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Callbacks de éxito
  // ─────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────
  // Paginación
  // ─────────────────────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.gyms.length / this.itemsPerPage);
  }

  get paginatedGyms(): Gym[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.gyms.slice(start, start + this.itemsPerPage);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const windowSize = 5;

    if (total <= windowSize) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = this.currentPage - Math.floor(windowSize / 2);
    start = Math.max(1, start);

    let end = start + windowSize - 1;
    if (end > total) {
      end = total;
      start = end - windowSize + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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

  // ─────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────

  trackById(_: number, item: Gym): number {
    return item.id;
  }
}
