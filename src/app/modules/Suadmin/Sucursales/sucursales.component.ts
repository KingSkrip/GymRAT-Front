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
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';

import {
  SucursalesService,
  Sucursal,
  SucursalMetrics,
  SucursalFilters,
  SucursalPayload,
  Subscription,
  Payment,
  SubscriptionPayload,
  PaymentPayload,
  GymOption,
} from './sucursales.service';

type FilterStatus = '' | 'active' | 'inactive';
type FilterSubStatus = '' | 'sub_active' | 'sub_expiring' | 'sub_expired' | 'no_sub';
type ModalMode =
  | 'edit'
  | 'detail'
  | 'confirm-toggle'
  | 'confirm-delete'
  | 'add-subscription'
  | 'edit-subscription'
  | 'add-payment';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class SucursalesComponent implements OnInit, OnDestroy {
  sucursales: Sucursal[] = [];
  metrics: SucursalMetrics | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  gymOptions: GymOption[] = [];
  selectedGymFilter: number | null = null;

  activeFilter: FilterStatus = '';
  activeSubFilter: FilterSubStatus = '';
  searchTerm = '';

  modalMode: ModalMode | null = null;
  selectedSucursal: Sucursal | null = null;
  selectedSubscription: Subscription | null = null;

  form: FormGroup;
  subscriptionForm: FormGroup;
  paymentForm: FormGroup;
  formError: string | null = null;

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  currentPage = 1;
  itemsPerPage = 6;

  readonly filterPills: { label: string; value: FilterStatus; metric: keyof SucursalMetrics }[] = [
    { label: 'Todas', value: '', metric: 'total' },
    { label: 'Activas', value: 'active', metric: 'active' },
    { label: 'Inactivas', value: 'inactive', metric: 'inactive' },
  ];

  readonly subFilterPills: {
    label: string;
    value: FilterSubStatus;
    metric: keyof SucursalMetrics;
    color: string;
  }[] = [
    { label: 'Sub. activa', value: 'sub_active', metric: 'sub_active', color: 'green' },
    { label: 'Por vencer', value: 'sub_expiring', metric: 'sub_expiring', color: 'yellow' },
    { label: 'Vencida', value: 'sub_expired', metric: 'sub_expired', color: 'red' },
    { label: 'Sin sub.', value: 'no_sub', metric: 'no_sub', color: 'gray' },
  ];

  private destroy$ = new Subject<void>();
  private load$ = new Subject<SucursalFilters>();
  private search$ = new Subject<string>();
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private svc = inject(SucursalesService);

  constructor() {
    this.form = this.buildEditForm();
    this.subscriptionForm = this.buildSubscriptionForm();
    this.paymentForm = this.buildPaymentForm();
  }

  ngOnInit(): void {
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
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  setFilter(value: FilterStatus): void {
    this.activeFilter = value;
    this.triggerLoad();
  }

  setSubFilter(value: FilterSubStatus): void {
    this.activeSubFilter = this.activeSubFilter === value ? '' : value;
    this.triggerLoad();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  onGymFilterChange(gymId: number | null): void {
    this.selectedGymFilter = gymId;
    this.triggerLoad();
  }

  // ── Modales ──────────────────────────────────────────────────────────

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

  openEdit(s: Sucursal, event?: Event): void {
    event?.stopPropagation();
    this.selectedSucursal = s;
    this.form = this.buildEditForm(s);
    this.formError = null;
    this.modalMode = 'edit';
    this.cdr.markForCheck();
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
    this.subscriptionForm = this.buildSubscriptionForm();
    this.formError = null;
    this.modalMode = 'add-subscription';
    this.cdr.markForCheck();
  }

  openEditSubscription(sub: Subscription, event?: Event): void {
    event?.stopPropagation();
    this.selectedSubscription = sub;
    this.subscriptionForm = this.buildSubscriptionForm(sub);
    this.formError = null;
    this.modalMode = 'edit-subscription';
    this.cdr.markForCheck();
  }

  openAddPayment(sub: Subscription, event?: Event): void {
    event?.stopPropagation();
    this.selectedSubscription = sub;
    this.paymentForm = this.buildPaymentForm();
    this.formError = null;
    this.modalMode = 'add-payment';
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedSucursal = null;
    this.selectedSubscription = null;
    this.drawerDeltaY = 0;
    this.formError = null;
    this.cdr.markForCheck();
  }

  closeSubModal(): void {
    // Cierra el sub-modal pero mantiene el detail abierto
    if (
      this.modalMode === 'add-subscription' ||
      this.modalMode === 'edit-subscription' ||
      this.modalMode === 'add-payment'
    ) {
      this.modalMode = 'detail';
      this.selectedSubscription = null;
      this.formError = null;
      this.cdr.markForCheck();
    } else {
      this.closeModal();
    }
  }

  // ── Acciones ──────────────────────────────────────────────────────────

  submitEdit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.formError = null;
    const payload = this.form.value as SucursalPayload;

    const req$ = this.selectedSucursal
      ? this.svc.update(this.selectedSucursal.id, payload)
      : this.svc.create(payload);

    req$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.zone.run(() => {
            this.saving = false;
            this.cdr.markForCheck();
          });
        }),
      )
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.closeModal();
            this.triggerLoad();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.formError = err?.error?.message ?? 'Ocurrió un error.';
            this.cdr.markForCheck();
          });
        },
      });
  }

  confirmToggle(): void {
    if (!this.selectedSucursal) return;
    this.saving = true;
    this.svc
      .toggle(this.selectedSucursal.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.saving = false;
            this.closeModal();
            this.triggerLoad();
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

  confirmDelete(): void {
    if (!this.selectedSucursal) return;
    this.saving = true;
    this.svc
      .delete(this.selectedSucursal.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.saving = false;
            this.closeModal();
            this.triggerLoad();
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

  submitSubscription(): void {
    if (this.subscriptionForm.invalid) {
      this.subscriptionForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.formError = null;
    const payload = this.subscriptionForm.value as SubscriptionPayload;
    const isEdit = this.modalMode === 'edit-subscription';

    const req$ = isEdit
      ? this.svc.updateSubscription(
          this.selectedSucursal!.id,
          this.selectedSubscription!.id,
          payload,
        )
      : this.svc.storeSubscription(this.selectedSucursal!.id, payload);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.zone.run(() => {
          this.saving = false;
          // Refrescar detalle
          this.reloadDetail();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.saving = false;
          this.formError = err?.error?.message ?? 'Ocurrió un error.';
          this.cdr.markForCheck();
        });
      },
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.formError = null;
    const payload = this.paymentForm.value as PaymentPayload;

    this.svc
      .storePayment(this.selectedSucursal!.id, this.selectedSubscription!.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.saving = false;
            this.reloadDetail();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.saving = false;
            this.formError = err?.error?.message ?? 'Ocurrió un error.';
            this.cdr.markForCheck();
          });
        },
      });
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
            this.saving = false;
            this.triggerLoad();
            this.cdr.markForCheck();
          });
        },
      });
  }

  // ── Drawer touch ─────────────────────────────────────────────────────

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
    if (this.drawerDeltaY > 90) this.closeModal();
    else this.drawerDeltaY = 0;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  getMetricValue(key: keyof SucursalMetrics): number {
    return this.metrics?.[key] ?? 0;
  }

  trackById(_: number, item: Sucursal): number {
    return item.id;
  }

  trackBySubId(_: number, item: Subscription): number {
    return item.id;
  }

  trackByPayId(_: number, item: Payment): number {
    return item.id;
  }

  get isToggleDeactivate(): boolean {
    return !!this.selectedSucursal?.is_active;
  }

  hasError(form: FormGroup, field: string, error = 'required'): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched && ctrl?.hasError(error));
  }

  get totalPages(): number {
    return Math.ceil(this.sucursales.length / this.itemsPerPage);
  }

  get paginatedSucursales(): Sucursal[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.sucursales.slice(start, start + this.itemsPerPage);
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

  // ── Form builders ─────────────────────────────────────────────────────

  private buildEditForm(s?: Sucursal): FormGroup {
    return this.fb.group({
      name: [s?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      gym_id: [s?.gym_id ?? null, Validators.required],
      address: [s?.address ?? ''],
      phone: [s?.phone ?? ''],
      latitude: [s?.latitude ?? null],
      longitude: [s?.longitude ?? null],
      is_active: [s?.is_active ?? true],
    });
  }

  private buildSubscriptionForm(sub?: Subscription): FormGroup {
    return this.fb.group({
      plan: [sub?.plan ?? 'monthly', Validators.required],
      price: [sub?.price ?? null, [Validators.required, Validators.min(0)]],
      starts_at: [sub?.starts_at ?? '', Validators.required],
      ends_at: [sub?.ends_at ?? ''],
    });
  }

  private buildPaymentForm(): FormGroup {
    return this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      status: ['paid', Validators.required],
      payment_method: [''],
      transaction_id: [''],
      paid_at: [''],
    });
  }

  openAddSucursal(): void {
    this.selectedSucursal = null;
    this.form = this.buildEditForm();
    this.formError = null;
    this.modalMode = 'edit';
    this.cdr.markForCheck();
  }
}
