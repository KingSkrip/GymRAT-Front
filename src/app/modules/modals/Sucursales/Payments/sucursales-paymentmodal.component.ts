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
import { Subject, takeUntil } from 'rxjs';
import {
  PaymentPayload,
  Subscription,
  Sucursal,
  SucursalesService,
} from '../../../Suadmin/Sucursales/sucursales.service';

@Component({
  selector: 'sucursalespayment-modal',
  standalone: true,
  templateUrl: './sucursales-paymentmodal.component.html',
  styleUrls: ['./sucursales-paymentmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class SucursalesPaymentComponent implements OnInit, OnDestroy {
  @Input({ required: true }) sucursal!: Sucursal;
  @Input({ required: true }) subscription!: Subscription;

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
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      status: ['paid', Validators.required],
      payment_method: [''],
      transaction_id: [''],
      paid_at: [''],
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

  planLabel(plan: string): string {
    return { monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual' }[plan] ?? plan;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.formError = null;
    const payload = this.form.value as PaymentPayload;

    this.svc
      .storePayment(this.sucursal.id, this.subscription.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.saving = false;
            this.saved.emit();
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