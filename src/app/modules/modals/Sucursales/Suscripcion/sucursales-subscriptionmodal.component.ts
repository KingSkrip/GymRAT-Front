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
  Subscription,
  Sucursal,
  SucursalesService,
  SubscriptionPayload,
} from '../../../Suadmin/Sucursales/sucursales.service';

@Component({
  selector: 'sucursalessubscription-modal',
  standalone: true,
  templateUrl: './sucursales-subscriptionmodal.component.html',
  styleUrls: ['./sucursales-subscriptionmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class SucursalesSubscriptionComponent implements OnInit, OnDestroy {
  @Input({ required: true }) sucursal!: Sucursal;
  /** Si viene con valor, el modal edita esa suscripción; si es null, crea una nueva. */
  @Input() subscription: Subscription | null = null;

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
    const sub = this.subscription;
    this.form = this.fb.group({
      plan: [sub?.plan ?? 'monthly', Validators.required],
      price: [sub?.price ?? null, [Validators.required, Validators.min(0)]],
      starts_at: [sub?.starts_at ?? '', Validators.required],
      ends_at: [sub?.ends_at ?? ''],
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
    const payload = this.form.value as SubscriptionPayload;

    const req$ = this.subscription
      ? this.svc.updateSubscription(this.sucursal.id, this.subscription.id, payload)
      : this.svc.storeSubscription(this.sucursal.id, payload);

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