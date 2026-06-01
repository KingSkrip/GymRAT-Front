export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface WorkoutDay {
  day: string;
  exercises: WorkoutExercise[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: string;
  photo: string;
  usuario?: string;
  perfil?: number;
  permissions?: number | number[];
  sub_permissions?: number[];
  encrypt?: number;
  identity_id?: number;
  firebird_user_id?: string | number;
  firebird_user_clave?: string | number;
  roleId?: number;

 access_sessions?: {
    date: string;
    entrada: { at: string; method: string } | null;
    salida:  { at: string; method: string } | null;
  }[];

   workout?: {
    id: number;
    title: string;
    description: string;
    exercises: WorkoutDay[];
  };
}
