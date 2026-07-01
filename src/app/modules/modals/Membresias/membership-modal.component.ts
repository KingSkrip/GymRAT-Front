import {
  Component, Input, Output, EventEmitter, OnInit,
  inject, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PagosService } from '../../Pagos/Pagos.service';


@Component({
  selector: 'membership-modal',
  standalone: true,
  templateUrl: './membership-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class MembershipModalComponent implements OnInit {
  @Input({ required: true }) userId!: number;
  @Input({ required: true }) userName!: string;
  @Input() currentMembership: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  form!: FormGroup;
  saving = false;
  error: string | null = null;

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  private fb     = inject(FormBuilder);
  private pagos  = inject(PagosService); // 👈
  private cdr    = inject(ChangeDetectorRef);

  readonly types = [
    { value: 'visit',   label: 'Visita'        },
    { value: 'monthly', label: 'Mensual'        },
    { value: 'yearly',  label: 'Anual'          },
    { value: 'custom',  label: 'Personalizada'  },
  ];

  readonly prices: Record<string, number> = {
    visit: 50, monthly: 499, yearly: 4999, custom: 0,
  };

readonly membershipTypeLabels: Record<string, string> = {
  monthly: 'Mensual',
  yearly:  'Anual',
  visit:   'Visita',
  custom:  'Personalizada',
};

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      type:       ['monthly', Validators.required],
      price:      [499, [Validators.required, Validators.min(0)]],
      start_date: [today, Validators.required],
      end_date:   [null],
    });

    this.form.get('type')!.valueChanges.subscribe(type => {
      this.form.patchValue({ price: this.prices[type] ?? 0 });
      this.updateEndDateVisibility(type);
      this.cdr.markForCheck();
    });
  }

  updateEndDateVisibility(type: string): void {
    const endCtrl = this.form.get('end_date')!;
    if (type === 'custom') {
      endCtrl.setValidators([Validators.required]);
    } else {
      endCtrl.clearValidators();
      endCtrl.setValue(null);
    }
    endCtrl.updateValueAndValidity();
  }

  get isCustom(): boolean {
    return this.form.get('type')?.value === 'custom';
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error  = null;

    this.pagos.createMembership(this.userId, this.form.value).subscribe({
      next: (res) => {
        this.saving = false;
        this.saved.emit(res.membership);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Error al guardar membresía.';
        this.cdr.markForCheck();
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
    if (this.drawerDeltaY > 90) this.close.emit();
    else { this.drawerDeltaY = 0; this.cdr.markForCheck(); }
  }
}