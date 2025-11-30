import PreviousNextWorkouts, {
  type PreviousNextWorkoutsInterface,
} from "./previousNextWorkouts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function WorkoutNavigation({
  lastWorkoutId,
  nextWorkoutId,
}: PreviousNextWorkoutsInterface) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4 items-center">
      <PreviousNextWorkouts
        lastWorkoutId={lastWorkoutId}
        nextWorkoutId={nextWorkoutId}
      />
      <Button
        onClick={() => navigate("/workouts")}
        className=""
        variant={"secondary"}
      >
        Back to workouts
      </Button>
    </div>
  );
}
