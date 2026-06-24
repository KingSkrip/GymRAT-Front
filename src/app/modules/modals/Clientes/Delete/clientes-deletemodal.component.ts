import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Cliente } from '../../../Suadmin/Clientes/clientes.service';


@Component({
  selector: 'clientedelete-modal',
  standalone: true,
  templateUrl: './clientes-deletemodal.component.html',
  styleUrls: ['./clientes-deletemodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class ClienteDeleteComponent {
  @Input({ required: true }) cliente!: Cliente;
  @Input() saving = false;
 
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}
 