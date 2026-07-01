// dieta-form-modal.component.ts
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Diet, DietPayload, Meal } from '../../../../Coach/Expediente/expediente.service'; // ajusta la ruta a tu service

export type DietaFormModel = Partial<DietPayload> & { meals: Partial<Meal>[] };

@Component({
  selector: 'dieta-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './dieta-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietaFormModalComponent {
  /** Controla si el modal está visible */
  @Input() show = false;

  /** Si viene una dieta, el modal entra en modo edición */
  @Input() editingDieta: Diet | null = null;

  /** Modelo del formulario */
  @Input() form: DietaFormModel = this.emptyForm();

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveDieta = new EventEmitter<DietaFormModel>();

  emptyForm(): DietaFormModel {
    return {
      title: '',
      description: '',
      is_active: true,
      starts_at: '',
      ends_at: '',
      meals: [],
    };
  }

  addMeal() {
    this.form.meals.push({
      meal: '',
      food: '',
      quantity: 0,
      unit: 'g',
      order: this.form.meals.length + 1,
    });
  }

  removeMeal(i: number) {
    this.form.meals.splice(i, 1);
  }

  onClose() {
    this.closeModal.emit();
  }

  onSave() {
    this.saveDieta.emit(this.form);
  }
}
