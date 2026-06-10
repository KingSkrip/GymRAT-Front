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

type FilterStatus = '' | 'active' | 'inactive' | 'expiring' | 'expired';
type ModalMode = 'create' | 'edit' | 'detail' | 'confirm-toggle' | 'confirm-delete';

@Component({
  selector: 'app-suadmin-clientes',
  standalone: true,
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class ClientesComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  metrics: ClienteMetrics | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  activeFilter: FilterStatus = '';
  searchTerm = '';

  modalMode: ModalMode | null = null;
  selectedCliente: Cliente | null = null;
  form: FormGroup;
  formError: string | null = null;

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  readonly filterPills: { label: string; value: FilterStatus; metric: keyof ClienteMetrics }[] = [
    { label: 'Todos', value: '', metric: 'total' },
    { label: 'Activos', value: 'active', metric: 'active' },
    { label: 'Por vencer', value: 'expiring', metric: 'expiring' },
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
  private fb = inject(FormBuilder);
  private svc = inject(ClientesService);

  constructor() {
    this.form = this.buildForm();
  }

  ngOnInit(): void {
    this.load$
      .pipe(
        switchMap((filters) => {
          this.loading = true;
          this.error = null;
          this.clientes = [];
          this.cdr.markForCheck();

          return this.svc.getAll(filters).pipe(
            catchError((err) => {
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
        this.currentPage = 1;
        this.loading = false;
        this.cdr.markForCheck();
      });

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.triggerLoad();
      });

    this.triggerLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  setFilter(value: FilterStatus): void {
    this.activeFilter = value;
    this.triggerLoad();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  openCreate(): void {
    this.selectedCliente = null;
    this.form = this.buildForm();
    this.formError = null;
    this.modalMode = 'create';
    this.cdr.markForCheck();
  }

  openEdit(c: Cliente, event?: Event): void {
    event?.stopPropagation();
    this.selectedCliente = c;
    this.form = this.buildForm(c);
    this.formError = null;
    this.modalMode = 'edit';
    this.cdr.markForCheck();
  }

  openDetail(c: Cliente): void {
    this.selectedCliente = c;
    this.modalMode = 'detail';
    this.cdr.markForCheck();

    this.svc
      .getOne(c.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.selectedCliente = res.data;
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          console.error('[Clientes] error al cargar detalle:', err);
        },
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
    this.drawerDeltaY = 0;
    this.formError = null;
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.warn('[Clientes] submit bloqueado — form inválido');
      return;
    }

    this.saving = true;
    this.formError = null;
    const payload = this.form.value as ClientePayload;
    const isCreate = this.modalMode === 'create';
    const req$ = isCreate
      ? this.svc.create(payload)
      : this.svc.update(this.selectedCliente!.id, payload);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.saving = false;
          this.closeModal();
          this.triggerLoad();
        });
      },
      error: (err) => {
        console.error('[Clientes] submit error:', err);
        this.zone.run(() => {
          this.saving = false;
          this.formError = err?.error?.message ?? 'Ocurrió un error. Intenta de nuevo.';
          this.cdr.markForCheck();
        });
      },
    });
  }

  confirmToggle(): void {
    if (!this.selectedCliente) return;
    this.saving = true;
    this.svc
      .toggle(this.selectedCliente.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.saving = false;
            this.closeModal();
            this.triggerLoad();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.saving = false;
            this.cdr.markForCheck();
          });
        },
      });
  }

  confirmDelete(): void {
    if (!this.selectedCliente) return;
    this.saving = true;

    this.svc
      .delete(this.selectedCliente.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.saving = false;
            this.closeModal();
            this.triggerLoad();
          });
        },
        error: (err) => {
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
    if (this.drawerDeltaY > 90) this.closeModal();
    else this.drawerDeltaY = 0;
  }

  getMetricValue(key: keyof ClienteMetrics): number {
    return this.metrics?.[key] ?? 0;
  }

  trackById(_: number, item: Cliente): number {
    return item.id;
  }

  get isToggleDeactivate(): boolean {
    return !!this.selectedCliente?.is_active;
  }

  private buildForm(c?: Cliente): FormGroup {
    return this.fb.group({
      name: [c?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      email: [c?.email ?? '', [Validators.required, Validators.email]],
      phone: [c?.phone ?? ''],
      subscription_start: [c?.subscription_start ?? '', Validators.required],
      subscription_end: [c?.subscription_end ?? '', Validators.required],
      is_active: [c?.is_active ?? true],
    });
  }

  hasError(field: string, error = 'required'): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched && ctrl?.hasError(error));
  }

  get totalPages(): number {
    return Math.ceil(this.clientes.length / this.itemsPerPage);
  }

  get paginatedClientes(): Cliente[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.clientes.slice(start, start + this.itemsPerPage);
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
