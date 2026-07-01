import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  Workout,
  WorkoutPayload,
  WorkoutDay,
  WorkoutDayExercise,
  WorkoutGoal,
  WorkoutLevel,
} from '../../../../Coach/Expediente/expediente.service';
import {
  ExcersisesService,
  Exercise,
  MetricType,
  MuscleGroup,
} from '../../../../Suadmin/Excersises/Excersises.service';

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazo: 'Antebrazo',
  piernas: 'Piernas',
  gluteos: 'Glúteos',
  pantorrillas: 'Pantorrillas',
  abdomen: 'Abdomen',
  cuerpo_completo: 'Cuerpo completo',
  cardio: 'Cardio',
};

const WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
];

@Component({
  selector: 'rutina-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './rutina-form-modal.component.html',
  styleUrls: ['./rutina-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutinaFormModalComponent implements OnInit {
  @Input() show = false;
  @Input() editingRutina: Workout | null = null;
  @Input() form: Partial<WorkoutPayload> = this.emptyForm();

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveRutina = new EventEmitter<Partial<WorkoutPayload>>();

  catalog: Exercise[] = [];
  loadingCatalog = false;
  searchTerm = '';
  muscleGroupFilter: MuscleGroup | '' = '';
  muscleGroups = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][];
  weekdayOptions = WEEKDAY_LABELS;

  goals: WorkoutGoal[] = [
    'Fuerza',
    'Hipertrofia',
    'Pérdida de grasa',
    'Acondicionamiento físico',
    'Rehabilitación',
    'Personalizado',
  ];
  levels: WorkoutLevel[] = ['Principiante', 'Intermedio', 'Avanzado'];

  activePickerDay: number | null = null;

  constructor(private excersisesService: ExcersisesService) {}

  ngOnInit(): void {
    this.loadCatalog();
    this.ensureDefaultDay();
    if (!this.form.days || this.form.days.length === 0) {
      this.form.days = [this.emptyDay(1)];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cada vez que el padre abre el modal (show pasa a true) o cambia el form
    if (changes['show'] && this.show) {
      this.ensureDefaultDay();
      this.activePickerDay = null; // resetea el picker abierto de la vez anterior
    }
  }

  private ensureDefaultDay(): void {
    if (!this.form.days || this.form.days.length === 0) {
      this.form.days = [this.emptyDay(1)];
    }
  }

  emptyForm(): Partial<WorkoutPayload> {
    return {
      title: '',
      description: '',
      goal: 'Personalizado',
      level: 'Principiante',
      days_per_week: 3,
      is_active: true,
      days: [],
    };
  }

  emptyDay(dayNumber: number): WorkoutDay {
    return {
      day_number: dayNumber,
      label: '',
      weekdays: [],
      notes: '',
      order: dayNumber - 1,
      exercises: [],
    };
  }

  loadCatalog(): void {
    this.loadingCatalog = true;
    this.excersisesService
      .list({
        search: this.searchTerm || undefined,
        muscle_group: (this.muscleGroupFilter as MuscleGroup) || undefined,
        per_page: 50,
        is_active: true,
      })
      .subscribe({
        next: (res) => {
          this.catalog = res.data;
          this.loadingCatalog = false;
        },
        error: () => {
          this.catalog = [];
          this.loadingCatalog = false;
        },
      });
  }

  onSearchChange(): void {
    this.loadCatalog();
  }

  onMuscleGroupChange(): void {
    this.loadCatalog();
  }

  togglePicker(dayIndex: number): void {
    this.activePickerDay = this.activePickerDay === dayIndex ? null : dayIndex;
  }

  isSelected(dayIndex: number, exercise: Exercise): boolean {
    return !!this.form.days?.[dayIndex]?.exercises.some((e) => e.exercise_id === exercise.id);
  }

  addDay(): void {
    const days = this.form.days ?? [];
    const nextNumber = days.length ? Math.max(...days.map((d) => d.day_number)) + 1 : 1;
    this.form.days = [...days, this.emptyDay(nextNumber)];
  }

  removeDay(index: number): void {
    this.form.days = (this.form.days ?? []).filter((_, i) => i !== index);
    if (this.activePickerDay === index) this.activePickerDay = null;
  }

  moveDay(index: number, direction: -1 | 1): void {
    const list = [...(this.form.days ?? [])];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    list.forEach((d, i) => (d.order = i));
    this.form.days = list;
  }

  toggleWeekday(dayIndex: number, weekday: number): void {
    const day = this.form.days?.[dayIndex];
    if (!day) return;
    const current = day.weekdays ?? [];
    day.weekdays = current.includes(weekday)
      ? current.filter((w) => w !== weekday)
      : [...current, weekday].sort();
  }

  isWeekdaySelected(dayIndex: number, weekday: number): boolean {
    return !!this.form.days?.[dayIndex]?.weekdays?.includes(weekday);
  }

  addExerciseFromCatalog(dayIndex: number, exercise: Exercise): void {
    if (this.isSelected(dayIndex, exercise)) return;
    const item: WorkoutDayExercise = {
      exercise_id: exercise.id,
      name: exercise.name,
      metric_type: exercise.metric_type,
      ...this.defaultsFor(exercise.metric_type),
    };
    const day = this.form.days![dayIndex];
    day.exercises = [...day.exercises, item];
  }

  addFreeExercise(dayIndex: number): void {
    const day = this.form.days![dayIndex];
    const item: WorkoutDayExercise = {
      exercise_id: null,
      name: '',
      sets: 3,
      reps: '10-12',
    };
    day.exercises = [...day.exercises, item];
  }

  removeExercise(dayIndex: number, exIndex: number): void {
    const day = this.form.days![dayIndex];
    day.exercises = day.exercises.filter((_, i) => i !== exIndex);
  }

  moveExercise(dayIndex: number, exIndex: number, direction: -1 | 1): void {
    const day = this.form.days![dayIndex];
    const list = [...day.exercises];
    const target = exIndex + direction;
    if (target < 0 || target >= list.length) return;
    [list[exIndex], list[target]] = [list[target], list[exIndex]];
    list.forEach((e, i) => (e.order = i));
    day.exercises = list;
  }

  private defaultsFor(metricType: MetricType): Partial<WorkoutDayExercise> {
    switch (metricType) {
      case 'duration':
        return { sets: 1, reps: '1', duration_sec: 60 };
      case 'distance':
        return { sets: 1, reps: '1', distance_m: 0 };
      case 'reps_only':
        return { sets: 3, reps: '10-12' };
      default:
        return { sets: 3, reps: '10-12', weight_kg: 0 };
    }
  }

  muscleGroupLabel(mg: MuscleGroup): string {
    return MUSCLE_GROUP_LABELS[mg] ?? mg;
  }

  onClose() {
    this.closeModal.emit();
  }

  onSave() {
    this.saveRutina.emit(this.form);
  }

  openDatePicker(input: HTMLInputElement): void {
    const picker = input as HTMLInputElement & {
      showPicker?: () => void;
    };

    if (picker.showPicker) {
      picker.showPicker();
    } else {
      input.focus();
      input.click();
    }
  }
}
