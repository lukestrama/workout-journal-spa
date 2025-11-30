import { useState } from "react";
import { useWorkouts } from "@/lib/hooks/useWorkouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "../components/Header";
import { WORKOUT_TYPES } from "@/lib/constants";
import Select from "react-select";
import { selectStyles } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import BackButton from "@/components/BackButton";

export default function AddWorkoutPage() {
  const navigate = useNavigate();
  const { createWorkout } = useWorkouts();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("other");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const workoutId = await createWorkout(title, date, type);
    navigate(`/workouts/${workoutId}`);
    setLoading(false);
  };

  return (
    <main className="p-6">
      <div className="flex items-baseline mb-4">
        <BackButton classNames="h-full" />
        <Header title="Add New Workout" />
      </div>

      <div className="space-y-4">
        <Label htmlFor="title">Workout Title</Label>
        <Input
          id="title"
          className="border p-2 w-full placeholder:text-gray-500 text-white"
          placeholder="Workout title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Label htmlFor="date">Date</Label>
        <Input
          type="date"
          id="date"
          className="border p-2 w-full placeholder:text-gray-500 text-white"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Label htmlFor="type">Workout type</Label>
        <Select
          id="type"
          options={WORKOUT_TYPES}
          onChange={(e) => setType(e?.value ? e.value : "other")}
          classNames={selectStyles}
        />
        <Button className="w-full mt-4" onClick={handleSave} disabled={loading}>
          Save Workout
        </Button>
      </div>
    </main>
  );
}
