import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/user/user.service';
import { Roles } from '../../auth/roles/dataroles';
import { MatIconModule } from '@angular/material/icon';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface WorkoutDay {
  day: string;
  exercises: WorkoutExercise[];
}

@Component({
  selector: 'app-rutina',
  standalone: true,
  templateUrl: './rutina.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatIconModule],
})
export class RutinaComponent implements OnInit {
  // ─── User info ───────────────────────────────────────────────
  userName = '';
  userRole = '';
  branchName = '';
selectedExerciseIndex: number = 0;
todayIndex = 0;
  // ─── Client / workout ────────────────────────────────────────
  clRoutineName = '';
  clWorkoutDescription = '';
  clRoutineWeek = 1;
  clRoutineWeekTotal = 8;
  clRoutinePercent = 12;
  clTodayDay = '';
  clTodayExercises: WorkoutExercise[] = [];
  clAllDays: WorkoutDay[] = [];
  clIsRestDay = false;
  selectedDayIndex = 0;
  showBottomSheet = false;
  selectedDay: WorkoutDay | null = null;
  private dragStartY = 0;
  private dragCurrentY = 0;
  sheetTranslateY = 0;
  sheetOpacity = 1;

  constructor(private _userService: UserService) {}

  ngOnInit(): void {
    this._userService.user$.subscribe((user: any) => {
      if (!user) return;
      this.userName = user.name ?? 'Usuario';
      this.branchName = user.gym?.name ?? user.branch?.name ?? '';
      const roleId = Number(user.permissions || 5);
      this.userRole = Roles[roleId as keyof typeof Roles] ?? 'client';
      this.loadWorkout(user);
    });
  }

private loadWorkout(user: any): void {
  const workout = user?.workout;

  if (!workout) {
    this.clRoutineName = 'Sin rutina asignada';
    this.clWorkoutDescription = '';
    this.clAllDays = [];
    this.clIsRestDay = false;
    this.clTodayDay = '';
    this.clTodayExercises = [];
    return;
  }

  this.clRoutineName = workout.title;
  this.clWorkoutDescription = workout.description;
  this.clAllDays = workout.exercises ?? [];

  const dayIndex = new Date().getDay();
  const routineIndex = dayIndex - 1;

  if (dayIndex === 0 || routineIndex >= this.clAllDays.length) {
    this.clIsRestDay = true;
    this.clTodayDay = 'Día de descanso';
    this.clTodayExercises = [];
    this.selectedDayIndex = 0;
    this.todayIndex = -1; 
  } else {
    this.clIsRestDay = false;
    this.clTodayDay = this.clAllDays[routineIndex].day;
    this.clTodayExercises = this.clAllDays[routineIndex].exercises;
    this.selectedDayIndex = routineIndex; // ← selecciona hoy por defecto
  }

  // Bottom sheet default = día de hoy
  this.selectedDay = this.clAllDays[this.selectedDayIndex] ?? null;
}

openBottomSheet(day: WorkoutDay, index: number): void {
  this.selectedDay = day;
  this.selectedDayIndex = index;
  this.selectedExerciseIndex = 0;
  this.showBottomSheet = true;
}

  onDragStart(e: TouchEvent): void {
    this.dragStartY = e.touches[0].clientY;
    this.dragCurrentY = 0;
  }

  onDragMove(e: TouchEvent): void {
    const delta = e.touches[0].clientY - this.dragStartY;
    if (delta < 0) return; // no subir
    this.dragCurrentY = delta;
    this.sheetTranslateY = delta;
    this.sheetOpacity = Math.max(0, 1 - delta / 300);
  }

  onDragEnd(): void {
    if (this.dragCurrentY > 120) {
      this.closeBottomSheet();
    } else {
      // snap back
      this.sheetTranslateY = 0;
      this.sheetOpacity = 1;
    }
    this.dragCurrentY = 0;
  }

  closeBottomSheet(): void {
    this.sheetTranslateY = 0;
    this.sheetOpacity = 1;
    this.showBottomSheet = false;
    this.selectedDay = null;
  }
}
