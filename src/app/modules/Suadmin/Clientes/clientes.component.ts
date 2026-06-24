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
  ClientesService,
  Cliente,
  ClienteMetrics,
  ClienteFilters,
  ClientePayload,
} from './clientes.service';
import { ClienteDetailsComponent } from '../../modals/Clientes/Details/clientes-detailsmodal.component';
import { LoaderComponent } from '../../../layout/layouts/loader/loader.component';
import { ClientesCreateComponent } from '../../modals/Clientes/Create/clientes-createmodal.component';
import { ClienteDeleteComponent } from '../../modals/Clientes/Delete/clientes-deletemodal.component';
import { ClienteLockComponent } from '../../modals/Clientes/lock/clientes-lockmodal.component';


type FilterStatus = '' | 'active' | 'inactive' | 'expiring' | 'expired';
type ModalMode = 'create' | 'edit' | 'detail' | 'confirm-toggle' | 'confirm-delete';

@Component({
  selector: 'app-suadmin-clientes',
  standalone: true,
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ClienteDetailsComponent,
    LoaderComponent,
    ClientesCreateComponent,
    ClienteDeleteComponent,
    ClienteLockComponent

  ],
})
export class ClientesComponent implements OnInit, OnDestroy {
  skeletonCount = 9;
  clientes: Cliente[] = [];
  metrics: ClienteMetrics | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  detailLoading = false;
  activeFilter: FilterStatus = '';
  searchTerm = '';

  modalMode: ModalMode | null = null;
  selectedCliente: Cliente | null = null;
  formError: string | null = null;

  readonly filterPills: { label: string; value: FilterStatus; metric: keyof ClienteMetrics }[] = [
    { label: 'Todos', value: '', metric: 'total' },
    { label: 'Activos', value: 'active', metric: 'active' },
    { label: 'Vence', value: 'expiring', metric: 'expiring' },
    { label: 'Vencidos', value: 'expired', metric: 'expired' },
    { label: 'Inactivos', value: 'inactive', metric: 'inactive' },
  ];

  currentPage = 1;
  itemsPerPage = 3;

  private destroy$ = new Subject<void>();
  private load$ = new Subject<ClienteFilters>();
  private search$ = new Subject<string>();
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private svc = inject(ClientesService);

  private resizeHandler = (): void => {
    this.zone.run(() => {
      this.calculateItemsPerPage();
      this.currentPage = 1;
      this.cdr.markForCheck();
    });
  };

  ngOnInit(): void {
    this.calculateItemsPerPage();
    this.zone.runOutsideAngular(() => window.addEventListener('resize', this.resizeHandler));

    this.load$
      .pipe(
        switchMap((filters) => {
          this.loading = true;
          this.error = null;
          this.clientes = [];
          this.cdr.markForCheck();

          return this.svc.getAll(filters).pipe(
            catchError(() => {
              this.error = 'No se pudo cargar la lista de clientes.';
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
        this.clientes = [...res.data];
        this.metrics = { ...res.metrics };
        this.skeletonCount = res.metrics.total;
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

  // ─── Helpers ──────────────────────────────────────────────────────────

  private calculateItemsPerPage(): void {
    const viewportH = window.innerHeight;
    const mobile = window.innerWidth < 768;

    if (mobile) {
      this.itemsPerPage = Math.max(1, Math.floor((viewportH - 220) / 90));
    } else {
      const cols = window.innerWidth >= 1024 ? 3 : 2;
      const rows = Math.max(1, Math.floor((viewportH - 290) / 255));
      this.itemsPerPage = (rows + 1) * cols;
    }
  }

  private triggerLoad(): void {
    const filters: ClienteFilters = {
      status: this.activeFilter || undefined,
      search: this.searchTerm || undefined,
    };
    this.loading = true;
    this.cdr.markForCheck();
    this.load$.next(filters);
  }

  // ─── Filtros ───────────────────────────────────────────────────────────

  setFilter(value: FilterStatus): void {
    this.activeFilter = value;
    this.triggerLoad();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  getMetricValue(key: keyof ClienteMetrics): number {
    return this.metrics?.[key] ?? 0;
  }

  // ─── Modales ───────────────────────────────────────────────────────────

  openCreate(): void {
    this.selectedCliente = null;
    this.formError = null;
    this.modalMode = 'create';
    this.cdr.markForCheck();
  }

  openEdit(c: Cliente, event?: Event): void {
    event?.stopPropagation();
    this.selectedCliente = c;
    this.formError = null;
    this.modalMode = 'edit';
    this.cdr.markForCheck();
  }

  openDetail(c: Cliente): void {
    this.selectedCliente = c;
    this.modalMode = 'detail';
    this.detailLoading = true;
    this.cdr.markForCheck();

    this.svc
      .getOne(c.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.selectedCliente = res.data;
            this.detailLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: (err) => console.error('[Clientes] error al cargar detalle:', err),
      });
  }

  openToggleConfirm(c: Cliente, event?: Event): void {
    event?.stopPropagation();
    this.selectedCliente = c;
    this.modalMode = 'confirm-toggle';
    this.cdr.markForCheck();
  }

  openDeleteConfirm(c: Cliente, event?: Event): void {
    event?.stopPropagation();
    this.selectedCliente = c;
    this.modalMode = 'confirm-delete';
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedCliente = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  // ─── Acciones ──────────────────────────────────────────────────────────

  onSubmitPayload(payload: ClientePayload): void {
    this.saving = true;
    this.formError = null;

    const isCreate = this.modalMode === 'create';
    const req$ = isCreate
      ? this.svc.create(payload)
      : this.svc.update(this.selectedCliente!.id, payload);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () =>
        this.zone.run(() => {
          this.saving = false;
          this.closeModal();
          this.triggerLoad();
        }),
      error: (err) =>
        this.zone.run(() => {
          this.saving = false;
          this.formError = err?.error?.message ?? 'Ocurrió un error. Intenta de nuevo.';
          this.cdr.markForCheck();
        }),
    });
  }

  confirmToggle(): void {
    if (!this.selectedCliente) return;
    this.saving = true;

    this.svc
      .toggle(this.selectedCliente.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () =>
          this.zone.run(() => {
            this.saving = false;
            this.closeModal();
            this.triggerLoad();
          }),
        error: () =>
          this.zone.run(() => {
            this.saving = false;
            this.cdr.markForCheck();
          }),
      });
  }

  confirmDelete(): void {
    if (!this.selectedCliente) return;
    this.saving = true;

    this.svc
      .delete(this.selectedCliente.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () =>
          this.zone.run(() => {
            this.saving = false;
            this.closeModal();
            this.triggerLoad();
          }),
        error: () =>
          this.zone.run(() => {
            this.saving = false;
            this.cdr.markForCheck();
          }),
      });
  }

  // ─── Paginación ────────────────────────────────────────────────────────

  trackById(_: number, item: Cliente): number {
    return item.id;
  }

  get totalPages(): number {
    return Math.ceil(this.clientes.length / this.itemsPerPage);
  }

  get paginatedClientes(): Cliente[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.clientes.slice(start, start + this.itemsPerPage);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const windowSize = 5;

    if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);

    let start = Math.max(1, this.currentPage - Math.floor(windowSize / 2));
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
}