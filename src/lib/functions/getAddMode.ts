import { ADD_MODES } from "@/lib/constants";
import type { Exercise } from "@/lib/supabase/models";

const getAddMode = (
  exercises: Exercise[],
  exerciseName: string,
  reps?: number
): typeof ADD_MODES.exercise | typeof ADD_MODES.set => {
  if (
    !!exerciseName &&
    (exercises.find((ex) => ex.name == exerciseName) || reps)
  ) {
    return ADD_MODES.set;
  }

  return ADD_MODES.exercise;
};

export default getAddMode;
