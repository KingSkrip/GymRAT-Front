import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  ChangeDetectionStrategy,
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
import { Cliente, ClientePayload } from '../../../Suadmin/Clientes/clientes.service';

export type CreateEditMode = 'create' | 'edit';
@Component({
  selector: 'clientecrate-modal',
  standalone: true,
  templateUrl: './clientes-createmodal.component.html',
  styleUrls: ['./clientes-createmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class ClientesCreateComponent implements OnInit {
  @Input() mode: CreateEditMode = 'create';
  @Input() cliente: Cliente | null = null;
  @Input() saving = false;
  @Input() formError: string | null = null;

  @Output() submitPayload = new EventEmitter<ClientePayload>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.form = this.buildForm(this.cliente ?? undefined);
  }

  private buildForm(c?: Cliente): FormGroup {
    return this.fb.group({
      name: [c?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      email: [c?.email ?? '', [Validators.required, Validators.email]],
      phone: [c?.phone ?? ''],
      password: ['', c ? [] : [Validators.required, Validators.minLength(6)]],
      is_active: [c?.is_active ?? true],
    });
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

    const raw = this.form.value as ClientePayload;

    const payload: ClientePayload =
      this.mode === 'create'
        ? raw
        : (({ password, ...rest }: any) => (password ? { ...rest, password } : rest))(raw);

    this.submitPayload.emit(payload);
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
    else this.drawerDeltaY = 0;
  }
}
