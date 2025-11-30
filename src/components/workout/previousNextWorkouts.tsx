import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export interface PreviousNextWorkoutsInterface {
  lastWorkoutId: number | null;
  nextWorkoutId: number | null;
}
export default function PreviousNextWorkouts({
  lastWorkoutId,
  nextWorkoutId,
}: PreviousNextWorkoutsInterface) {
  return (
    <div>
      <div className="flex gap-4 justify-between text-center w-full">
        <div className="w-[50%]">
          {lastWorkoutId && (
            <Button variant={"ghost"} asChild>
              <Link to={`/workouts/${lastWorkoutId}`}>Previous</Link>
            </Button>
          )}
        </div>
        <div className="w-[50%]">
          {nextWorkoutId && (
            <Button variant={"ghost"} asChild>
              <Link to={`/workouts/${nextWorkoutId}`}>Next</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
