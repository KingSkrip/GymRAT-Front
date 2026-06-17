import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
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
import { takeUntil, Subject } from 'rxjs';
import { ClientOption, Gym, GymPayload, GymsService } from '../../../Suadmin/Gyms/gyms.service';



type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-gym-form-modal',
  standalone: true,
  templateUrl: './gym-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class GymFormModalComponent implements OnInit, OnChanges {
  @Input() mode: ModalMode = 'create';
  @Input() gym: Gym | null = null;
  @Input() clientOptions: ClientOption[] = [];

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
  private svc = inject(GymsService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.form = this.buildForm(this.gym ?? undefined);
  }

  ngOnChanges(): void {
    if (this.form) {
      this.form = this.buildForm(this.gym ?? undefined);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.formError = null;
    const payload = this.form.value as GymPayload;
    const req$ =
      this.mode === 'create'
        ? this.svc.create(payload)
        : this.svc.update(this.gym!.id, payload);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.zone.run(() => {
          this.saving = false;
          this.saved.emit();
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

  hasError(field: string, error = 'required'): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched && ctrl?.hasError(error));
  }

  compareById(a: any, b: any): boolean {
    return +a === +b;
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

  private buildForm(g?: Gym): FormGroup {
    return this.fb.group({
      name: [g?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      system_client_id: [g?.system_client_id ? +g.system_client_id : null, Validators.required],
      address: [g?.address ?? ''],
      phone: [g?.phone ?? ''],
      is_active: [g?.is_active ?? true],
    });
  }
}