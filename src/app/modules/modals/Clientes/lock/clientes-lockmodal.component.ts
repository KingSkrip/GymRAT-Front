import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Cliente } from '../../../Suadmin/Clientes/clientes.service';


@Component({
  selector: 'clientelock-modal',
  standalone: true,
  templateUrl: './clientes-lockmodal.component.html',
  styleUrls: ['./clientes-lockmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class ClienteLockComponent {
  @Input({ required: true }) cliente!: Cliente;
  @Input() saving = false;
 
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
 
  get isDeactivate(): boolean {
    return !!this.cliente?.is_active;
  }
}