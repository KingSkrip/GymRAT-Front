import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Cliente } from '../../../Suadmin/Clientes/clientes.service';

@Component({
  selector: 'clientedetails-modal',
  standalone: true,
  templateUrl: './clientes-detailsmodal.component.html',
  styleUrls: ['./clientes-detailsmodal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class ClienteDetailsComponent implements OnInit, OnChanges, OnDestroy {
  
  @Input({ required: true }) cliente!: Cliente;
  @Input() loading = false;

  @Output() close = new EventEmitter<void>();
  @Output() toggleConfirm = new EventEmitter<Cliente>();
  @Output() deleteConfirm = new EventEmitter<Cliente>();

  drawerStartY = 0;
  drawerDeltaY = 0;
  drawerDragging = false;

  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] || changes['loading']) {
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {}

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
    if (this.drawerDeltaY > 90) {
      this.close.emit();
    } else {
      this.drawerDeltaY = 0;
      this.cdr.markForCheck();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onToggleConfirm(): void {
    this.toggleConfirm.emit(this.cliente);
  }

  onDeleteConfirm(): void {
    this.deleteConfirm.emit(this.cliente);
  }
}
