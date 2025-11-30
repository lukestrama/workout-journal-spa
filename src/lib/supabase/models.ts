export interface ExerciseSet {
  weight: number;
  reps: number;
  exercise_id: number;
  notes?: string;
  id: number;
  synced?: boolean;
  deleted?: boolean;
  updated_at: string;
  // grouping system
  group_id?: string | null; // same id = same group (superset, dropset, etc)
  type?: "dropset" | "superset" | null; // null = normal set
  order?: number; // 0, 1, 2, ... inside a group
}

export interface Exercise {
  id: number;
  name: string;
  sets?: ExerciseSet[];
  workout_id: number;
  workout_date?: string;
  synced?: boolean;
  updated_at: string;
  deleted?: boolean;
}

export interface Workout {
  id: number;
  title: string;
  date: string;
  exercises?: Exercise[];
  user_id: string;
  notes?: string;
  type: string;
  synced?: boolean;
  updated_at: string;
  deleted_at?: string | null;
}

export interface UserExercise {
  id: number;
  name: string;
  user_id: string;
  synced?: boolean;
}
