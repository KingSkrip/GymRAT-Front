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
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  GymOption,
  Sucursal,
  SucursalesService,
  SucursalPayload,
} from '../../../Suadmin/Sucursales/sucursales.service';

@Component({
  selector: 'sucursalescreate-modal',
  standalone: true,
  templateUrl: './sucursales-createmodal.component.html',
  styleUrls: ['./sucursales-createmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class SucursalesCreateComponent implements OnInit, OnDestroy {
  @Input() gymOptions: GymOption[] = [];
  /** Si viene con valor, el modal funciona en modo "editar"; si es null, modo "crear". */
  @Input() sucursal: Sucursal | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  saving = false;
  formError: string | null = null;

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private svc = inject(SucursalesService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const s = this.sucursal;
    this.form = this.fb.group({
      name: [s?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      gym_id: [s?.gym_id ?? null, Validators.required],
      address: [s?.address ?? ''],
      phone: [s?.phone ?? ''],
      latitude: [s?.latitude ?? null],
      longitude: [s?.longitude ?? null],
      is_active: [s?.is_active ?? true],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasError(field: string, error = 'required'): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched && ctrl?.hasError(error));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.formError = null;
    const payload = this.form.value as SucursalPayload;

    const req$ = this.sucursal
      ? this.svc.update(this.sucursal.id, payload)
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
        next: () => this.zone.run(() => this.saved.emit()),
        error: (err) =>
          this.zone.run(() => {
            this.formError = err?.error?.message ?? 'Ocurrió un error.';
            this.cdr.markForCheck();
          }),
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
    if (this.drawerDeltaY > 90) this.closed.emit();
    else this.drawerDeltaY = 0;
  }
}