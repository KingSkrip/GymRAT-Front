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
  GymsService,
  Gym,
  GymMetrics,
  GymFilters,
  GymPayload,
  GymBranch,
  ClientOption,
} from './gyms.service';

type FilterStatus = '' | 'active' | 'inactive';
type ModalMode = 'create' | 'edit' | 'detail' | 'confirm-toggle' | 'confirm-delete';

@Component({
  selector: 'app-suadmin-gyms',
  standalone: true,
  templateUrl: './gyms.component.html',
  styleUrls: ['./gyms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class GymsComponent implements OnInit, OnDestroy {
  gyms: Gym[] = [];
  metrics: GymMetrics | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  clientOptions: ClientOption[] = [];

  activeFilter: FilterStatus = '';
  searchTerm = '';

  modalMode: ModalMode | null = null;
  selectedGym: Gym | null = null;
  form: FormGroup;
  formError: string | null = null;

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  // Branch inline form inside detail
  showBranchForm = false;
  savingBranch = false;
  editingBranch: GymBranch | null = null;
  newBranch: Partial<GymBranch> = { name: '', address: '', phone: '' };

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
  private fb = inject(FormBuilder);
  private svc = inject(GymsService);

  constructor() {
    this.form = this.buildForm();
  }

  ngOnInit(): void {
    // Cargar lista de clientes para el select
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

  openCreate(): void {
    this.selectedGym = null;
    this.form = this.buildForm();
    this.formError = null;
    this.modalMode = 'create';
    this.cdr.markForCheck();
  }

  openEdit(g: Gym, event?: Event): void {
    event?.stopPropagation();
    this.selectedGym = g;
    this.formError = null;

    // Si ya hay clientes cargados, construye el form de inmediato
    if (this.clientOptions.length > 0) {
      this.form = this.buildForm(g);
      this.modalMode = 'edit';
      this.cdr.markForCheck();
      return;
    }

    // Si no, espera a que carguen y luego parchea el form
    this.svc
      .getClientsList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.clientOptions = res.data;
            this.form = this.buildForm(g);
            this.modalMode = 'edit';
            this.cdr.markForCheck();
          });
        },
      });
  }

  openDetail(g: Gym): void {
    this.selectedGym = g;
    this.showBranchForm = false;
    this.editingBranch = null;
    this.modalMode = 'detail';
    this.cdr.markForCheck();

    this.svc
      .getOne(g.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.selectedGym = { ...res.data };
          this.cdr.detectChanges();
        },
      });
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
    this.drawerDeltaY = 0;
    this.formError = null;
    this.showBranchForm = false;
    this.editingBranch = null;
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.formError = null;
    const payload = this.form.value as GymPayload;
    const isCreate = this.modalMode === 'create';
    const req$ = isCreate
      ? this.svc.create(payload)
      : this.svc.update(this.selectedGym!.id, payload);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.zone.run(() => {
          this.saving = false;
          this.closeModal();
          this.triggerLoad();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.saving = false;
          this.formError = err?.error?.message ?? 'Ocurrió un error. Intenta de nuevo.';
          this.cdr.markForCheck();
        });
      },
    });
  }

  confirmToggle(): void {
    if (!this.selectedGym) return;
    this.saving = true;
    this.cdr.markForCheck();

    this.svc
      .toggle(this.selectedGym.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.triggerLoad();
          this.cdr.markForCheck();
        },
        error: () => {
          this.saving = false;
          this.cdr.markForCheck();
        },
      });
  }

  confirmDelete(): void {
    if (!this.selectedGym) return;
    this.saving = true;
    this.svc
      .delete(this.selectedGym.id)
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

  // ── Branches (dentro del detail) ────────────────────────────────────

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
    this.svc
      .storeBranch(this.selectedGym.id, this.newBranch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (branch) => {
          this.zone.run(() => {
            this.selectedGym!.branches = [...(this.selectedGym!.branches ?? []), branch];
            this.selectedGym!.branch_count++;
            this.cancelAddBranch();
            this.savingBranch = false;
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
    if (!this.selectedGym || !this.editingBranch) return;
    this.savingBranch = true;
    this.svc
      .updateBranch(this.selectedGym.id, this.editingBranch.id, this.editingBranch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.zone.run(() => {
            const idx = this.selectedGym!.branches!.findIndex((b) => b.id === updated.id);
            if (idx !== -1) this.selectedGym!.branches![idx] = updated;
            this.editingBranch = null;
            this.savingBranch = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.savingBranch = false;
        },
      });
  }

  deleteBranch(branch: GymBranch): void {
    if (!this.selectedGym) return;
    this.svc
      .deleteBranch(this.selectedGym.id, branch.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.selectedGym!.branches = this.selectedGym!.branches!.filter(
              (b) => b.id !== branch.id,
            );
            this.selectedGym!.branch_count--;
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

  getMetricValue(key: keyof GymMetrics): number {
    return this.metrics?.[key] ?? 0;
  }

  trackById(_: number, item: Gym): number {
    return item.id;
  }

  get isToggleDeactivate(): boolean {
    return !!this.selectedGym?.is_active;
  }

  hasError(field: string, error = 'required'): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched && ctrl?.hasError(error));
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

  private buildForm(g?: Gym): FormGroup {
    return this.fb.group({
      name: [g?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      system_client_id: [g?.system_client_id ? +g.system_client_id : null, Validators.required],
      address: [g?.address ?? ''],
      phone: [g?.phone ?? ''],
      is_active: [g?.is_active ?? true],
    });
  }

  compareById(a: any, b: any): boolean {
    return +a === +b;
  }


}
