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
import { FormsModule } from '@angular/forms';
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
  MisSucursalesService,
  Sucursal,
  SucursalMetrics,
  SucursalFilters,
  Subscription,
  GymOption,
} from './missucursales.service';
import { SucursalesCreateComponent } from '../../modals/Sucursales/Create/sucursales-createmodal.component';
import { SucursalesDeleteComponent } from '../../modals/Sucursales/Delete/sucursales-deletemodal.component';
import { SucursalesDetailsComponent } from '../../modals/Sucursales/Details/sucursales-detailsmodal.component';
import { SucursalesLockComponent } from '../../modals/Sucursales/lock/sucursales-lockmodal.component';
import { SucursalesSubscriptionComponent } from '../../modals/Sucursales/Suscripcion/sucursales-subscriptionmodal.component';
import { SucursalesPaymentComponent } from '../../modals/Sucursales/Payments/sucursales-paymentmodal.component';

type FilterStatus = '' | 'active' | 'inactive';
type FilterSubStatus = '' | 'sub_active' | 'sub_expiring' | 'sub_expired' | 'no_sub';
type ModalMode =
  | 'create-edit'
  | 'detail'
  | 'confirm-toggle'
  | 'confirm-delete'
  | 'subscription'
  | 'payment';

@Component({
  selector: 'app-missucursales',
  standalone: true,
  templateUrl: './missucursales.component.html',
  styleUrls: ['./missucursales.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    SucursalesCreateComponent,
    SucursalesDeleteComponent,
    SucursalesDetailsComponent,
    SucursalesLockComponent,
    SucursalesSubscriptionComponent,
    SucursalesPaymentComponent,
  ],
})
export class MisSucursalesComponent implements OnInit, OnDestroy {
  // ── Estado ────────────────────────────────────────────────────────────
  sucursales: Sucursal[] = [];
  metrics: SucursalMetrics | null = null;
  loading = true;
  error: string | null = null;
  gymOptions: GymOption[] = [];

  // ── Filtros ───────────────────────────────────────────────────────────
  selectedGymFilter: number | null = null;
  activeFilter: FilterStatus = '';
  activeSubFilter: FilterSubStatus = '';
  searchTerm = '';
  showFilters = false;
  // ── Modales ───────────────────────────────────────────────────────────
  modalMode: ModalMode | null = null;
  selectedSucursal: Sucursal | null = null;
  selectedSubscription: Subscription | null = null;

  // ── Paginación ────────────────────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 6;

  readonly filterPills: { label: string; value: FilterStatus; metric: keyof SucursalMetrics }[] = [
    { label: 'Todas', value: '', metric: 'total' },
    { label: 'Activas', value: 'active', metric: 'active' },
    { label: 'Inactivas', value: 'inactive', metric: 'inactive' },
  ];

  // ── Inyecciones ───────────────────────────────────────────────────────
  private destroy$ = new Subject<void>();
  private load$ = new Subject<SucursalFilters>();
  private search$ = new Subject<string>();
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private svc = inject(MisSucursalesService);

  // ── Resize handler (guardado para poder removerlo en destroy) ─────────
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
      .getGymsList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.gymOptions = res.data;
          this.cdr.markForCheck();
        },
      });

    this.load$
      .pipe(
        switchMap((filters) => {
          this.loading = true;
          this.error = null;
          this.sucursales = [];
          this.cdr.markForCheck();

          return this.svc.getAll(filters).pipe(
            catchError(() => {
              this.error = 'No se pudo cargar la lista de sucursales.';
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
        this.sucursales = [...res.data];
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
      const reservedH = 260;
      const cardH = 85;

      this.itemsPerPage = Math.max(1, Math.floor((viewportH - reservedH) / cardH));
    } else {
      const reservedH = 280;
      const cardH = 190;
      const cols = window.innerWidth >= 1024 ? 3 : 2;

      const rows = Math.max(1, Math.floor((viewportH - reservedH) / cardH));

      this.itemsPerPage = rows * cols;
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Carga de datos
  // ─────────────────────────────────────────────────────────────────────

  private triggerLoad(): void {
    const filters: SucursalFilters = {
      status: this.activeFilter || undefined,
      sub_status: this.activeSubFilter || undefined,
      search: this.searchTerm || undefined,
      gym_id: this.selectedGymFilter ?? undefined,
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

  setSubFilter(value: FilterSubStatus): void {
    this.activeSubFilter = this.activeSubFilter === value ? '' : value;

    if (window.innerWidth < 640) {
      this.showFilters = false;
    }

    this.triggerLoad();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  onGymFilterChange(gymId: number | null): void {
    this.selectedGymFilter = gymId;

    if (window.innerWidth < 640) {
      this.showFilters = false;
    }

    this.triggerLoad();
  }

  getMetricValue(key: keyof SucursalMetrics): number {
    return this.metrics?.[key] ?? 0;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Apertura de modales
  // ─────────────────────────────────────────────────────────────────────

  openAddSucursal(): void {
    this.selectedSucursal = null;
    this.modalMode = 'create-edit';
    this.cdr.markForCheck();
  }

  openEdit(s: Sucursal, event?: Event): void {
    event?.stopPropagation();
    this.selectedSucursal = s;
    this.modalMode = 'create-edit';
    this.cdr.markForCheck();
  }

  openDetail(s: Sucursal): void {
    this.selectedSucursal = s;
    this.modalMode = 'detail';
    this.cdr.markForCheck();

    this.svc
      .getOne(s.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.selectedSucursal = { ...res.data };
            this.cdr.markForCheck();
          });
        },
      });
  }

  openToggleConfirm(s: Sucursal, event?: Event): void {
    event?.stopPropagation();
    this.selectedSucursal = s;
    this.modalMode = 'confirm-toggle';
    this.cdr.markForCheck();
  }

  openDeleteConfirm(s: Sucursal, event?: Event): void {
    event?.stopPropagation();
    this.selectedSucursal = s;
    this.modalMode = 'confirm-delete';
    this.cdr.markForCheck();
  }

  openAddSubscription(s?: Sucursal, event?: Event): void {
    event?.stopPropagation();
    if (s) this.selectedSucursal = s;
    this.selectedSubscription = null;
    this.modalMode = 'subscription';
    this.cdr.markForCheck();
  }

  openEditSubscription(sub: Subscription, event?: Event): void {
    event?.stopPropagation();
    this.selectedSubscription = sub;
    this.modalMode = 'subscription';
    this.cdr.markForCheck();
  }

  openAddPayment(sub: Subscription, event?: Event): void {
    event?.stopPropagation();
    this.selectedSubscription = sub;
    this.modalMode = 'payment';
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Cierre de modales
  // ─────────────────────────────────────────────────────────────────────

  closeModal(): void {
    this.modalMode = null;
    this.selectedSucursal = null;
    this.selectedSubscription = null;
    this.cdr.markForCheck();
  }

  closeSubModal(): void {
    if (this.selectedSucursal) {
      this.selectedSubscription = null;
      this.modalMode = 'detail';
      this.cdr.markForCheck();
    } else {
      this.closeModal();
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Callbacks de éxito
  // ─────────────────────────────────────────────────────────────────────

  onSucursalSaved(): void {
    this.closeModal();
    this.triggerLoad();
  }

  onSucursalToggled(): void {
    this.closeModal();
    this.triggerLoad();
  }

  onSucursalDeleted(): void {
    this.closeModal();
    this.triggerLoad();
  }

  onSubscriptionSaved(): void {
    this.reloadDetail();
  }

  onPaymentSaved(): void {
    this.reloadDetail();
  }

  private reloadDetail(): void {
    if (!this.selectedSucursal) return;
    const id = this.selectedSucursal.id;

    this.svc
      .getOne(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.selectedSucursal = { ...res.data };
            this.selectedSubscription = null;
            this.modalMode = 'detail';
            this.triggerLoad();
            this.cdr.markForCheck();
          });
        },
      });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Paginación
  // ─────────────────────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.sucursales.length / this.itemsPerPage);
  }

  get paginatedSucursales(): Sucursal[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.sucursales.slice(start, start + this.itemsPerPage);
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
  // Helpers de presentación
  // ─────────────────────────────────────────────────────────────────────

  trackById(_: number, item: Sucursal): number {
    return item.id;
  }

  planLabel(plan: string): string {
    return { monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual' }[plan] ?? plan;
  }

  paymentStatusLabel(status: string): string {
    return (
      { paid: 'Pagado', pending: 'Pendiente', failed: 'Fallido', cancelled: 'Cancelado' }[status] ??
      status
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

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    this.cdr.markForCheck();
  }

  closeFilters(): void {
    this.showFilters = false;
    this.cdr.markForCheck();
  }
}
