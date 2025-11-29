import { localSyncService } from "../supabase/services";
import { useUser } from "@clerk/react-router";
import type { Workout } from "../supabase/models";
import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "../supabase/SupabaseProvider";
import { db } from "../db";
import { genRandomInt } from "../utils";

export function useWorkouts() {
  const { user } = useUser();
  const { supabase } = useSupabase();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>("");

  // Extract stable user ID to prevent unnecessary re-renders on session refresh
  const userId = user?.id;

  const getWorkoutsSortedByDate = async () => {
    const workouts = await db.workouts;
    const activeWorkouts = await workouts
      .filter((w) => !w.deleted_at)
      .toArray();
    return activeWorkouts.sort((a, b) => (a.date < b.date ? 1 : -1));
  };

  const loadWorkouts = useCallback(async () => {
    if (!userId) return;
    try {
      const workouts = await getWorkoutsSortedByDate();
      const newWorkouts = workouts.map((w) => ({ ...w }));
      setWorkouts(newWorkouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workouts.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadWorkouts();
    }
  }, [userId, loadWorkouts]);

  const initialDataSync = useCallback(async () => {
    if (!userId) return;
    await localSyncService.fullInitialSync(userId, supabase!);
    loadWorkouts();
  }, [userId, supabase, loadWorkouts]);

  const refreshWorkouts = useCallback(async () => {
    if (!userId) return;
    try {
      const freshWorkouts = await getWorkoutsSortedByDate();
      // Create new array with new object references to ensure React detects changes
      const newWorkouts = freshWorkouts.map((w) => ({ ...w }));
      setWorkouts(newWorkouts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh workouts."
      );
    }
  }, [userId]);

  const createWorkout = useCallback(
    async (
      title: string,
      date: string,
      type: string
    ): Promise<number | void> => {
      if (!userId) throw Error("Must be signed in to create a workout");

      try {
        setLoading(true);
        const workoutId = await db.workouts.add({
          title,
          date,
          type,
          exercises: [],
          user_id: userId,
          id: genRandomInt(),
          synced: false,
          updated_at: new Date().toISOString(),
        });

        await refreshWorkouts();

        return workoutId;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to create workout"
        );
      } finally {
        setLoading(false);
      }
    },
    [userId, refreshWorkouts]
  );

  const deleteWorkout = useCallback(
    async (workoutId: number) => {
      if (!workoutId) return;

      try {
        const workout = await db.workouts.get(workoutId);
        if (workout?.synced) {
          // Marked delete from Dexie if synced
          await db.workouts.update(workoutId, {
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          await db.workouts.delete(workoutId);
        }
        await refreshWorkouts();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to delete workout"
        );
      }
    },
    [refreshWorkouts]
  );

  return {
    workouts,
    setWorkouts,
    loading,
    error,
    createWorkout,
    deleteWorkout,
    initialDataSync,
    refreshWorkouts,
  };
}
