import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import { db } from "../db";
import type { Workout } from "./models";

export async function syncWithSupabase(
  supabase: SupabaseClient,
  userId?: string,
) {
  // Reconcile local workouts against the server. This heals rows that got
  // flagged `synced: true` locally even though a previous push actually
  // failed (e.g. a rejected upsert whose error was ignored) — it flips the
  // flag back to `false`, without touching the row's data, so the push
  // phase below retries it. It also pulls in workouts that exist remotely
  // but not locally, and never overwrites a local row that still has
  // unpushed edits (`synced: false`).
  if (userId) {
    const { data: remoteWorkouts, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      console.error("Error fetching remote workouts:", error);
    } else if (remoteWorkouts) {
      const remoteIds = new Set(remoteWorkouts.map((w) => w.id));
      const localWorkouts = await db.workouts
        .where("user_id")
        .equals(userId)
        .toArray();

      for (const local of localWorkouts) {
        if (local.synced && !remoteIds.has(local.id)) {
          await db.workouts.update(local.id, { synced: false });
        }
      }

      for (const w of remoteWorkouts) {
        const local = localWorkouts.find((l) => l.id === w.id);
        if (!local || local.synced) {
          await db.workouts.put({ ...w, synced: true });
        }
      }

      console.log(
        `Reconciled ${remoteWorkouts.length} remote workouts for user ${userId}`,
      );
    }
  }
  const lastSynced = (await db.metadata.get("lastSyncedAt"))?.value ?? null;

  // First, let's check if we have any records without synced field and fix them
  const allWorkouts = await db.workouts.toArray();
  const allExercises = await db.exercises.toArray();
  const allSets = await db.sets.toArray();

  // Fix any records without synced field (assuming they're synced if they exist)
  for (const workout of allWorkouts) {
    if (workout.synced === undefined) {
      await db.workouts.update(workout.id, { synced: true });
    }
  }
  for (const exercise of allExercises) {
    if (exercise.synced === undefined) {
      await db.exercises.update(exercise.id!, { synced: true });
    }
  }
  for (const set of allSets) {
    if (set.synced === undefined) {
      await db.sets.update(set.id!, { synced: true });
    }
  }

  // -----------------------------
  // 1. PUSH local unsynced changes
  // -----------------------------
  const unsyncedWorkouts = await db.workouts
    .filter((w) => w.synced === false)
    .toArray();
  const unsyncedExercises = await db.exercises
    .filter((e) => e.synced === false)
    .toArray();
  const unsyncedSets = await db.sets
    .filter((s) => s.synced === false)
    .toArray();

  // delete these props to match supabase schema
  for (const w of unsyncedWorkouts) {
    delete w.exercises;
    delete w.synced;
  }
  for (const e of unsyncedExercises) {
    delete e.sets;
    delete e.synced;
  }
  for (const s of unsyncedSets) {
    delete s.synced;
  }

  // Push to Supabase. Only mark rows as `synced` when their upsert actually
  // succeeds — otherwise leave them `synced: false` so the reconciliation
  // step above (and the next sync's push) retries them. The rows themselves
  // are never touched here, so nothing is lost on a failed push.
  let workoutsPushError: PostgrestError | null = null;
  if (unsyncedWorkouts.length) {
    ({ error: workoutsPushError } = await supabase
      .from("workouts")
      .upsert(unsyncedWorkouts));
    if (workoutsPushError) {
      console.error("Error pushing workouts:", workoutsPushError);
    }
  }

  let exercisesPushError: PostgrestError | null = null;
  if (unsyncedExercises.length) {
    ({ error: exercisesPushError } = await supabase
      .from("exercises")
      .upsert(unsyncedExercises));
    if (exercisesPushError) {
      console.error("Error pushing exercises:", exercisesPushError);
    }
  }

  let setsPushError: PostgrestError | null = null;
  if (unsyncedSets.length) {
    ({ error: setsPushError } = await supabase
      .from("sets")
      .upsert(unsyncedSets));
    if (setsPushError) {
      console.error("Error pushing sets:", setsPushError);
    }
  }

  // Mark them as synced (only the ones that actually made it to the server)
  await db.transaction("rw", db.workouts, db.exercises, db.sets, async () => {
    if (!workoutsPushError) {
      for (const w of unsyncedWorkouts)
        await db.workouts.update(w.id, { synced: true });
    }
    if (!exercisesPushError) {
      for (const e of unsyncedExercises)
        await db.exercises.update(e.id!, { synced: true });
    }
    if (!setsPushError) {
      for (const s of unsyncedSets)
        await db.sets.update(s.id!, { synced: true });
    }
  });

  const deletedWorkouts = await db.workouts
    .filter((w) => w.deleted_at !== null)
    .toArray();
  const deletedExercises = await db.exercises
    .filter((e) => e.deleted === true)
    .toArray();
  const deletedSets = await db.sets.filter((s) => s.deleted === true).toArray();

  if (deletedWorkouts.length) {
    for (const w of deletedWorkouts) {
      const { error } = await supabase
        .from("workouts")
        .update({ deleted_at: w.deleted_at, updated_at: w.updated_at })
        .eq("id", w.id);
      if (error) {
        console.error("Error deleting workout remotely:", error);
      }
      // The local row stays soft-deleted (and hidden from the UI) either
      // way, so a failed remote delete is simply retried on the next sync.
    }
  }

  // Only bulk-delete locally once the remote delete actually succeeds —
  // deleting the local row first (or regardless of the result) would lose
  // the pending deletion for good if the remote call failed.
  let exercisesDeleteError: PostgrestError | null = null;
  if (deletedExercises.length) {
    ({ error: exercisesDeleteError } = await supabase
      .from("exercises")
      .delete()
      .in(
        "id",
        deletedExercises.map((e) => e.id),
      ));
    if (exercisesDeleteError) {
      console.error("Error deleting exercises remotely:", exercisesDeleteError);
    }
  }

  let setsDeleteError: PostgrestError | null = null;
  if (deletedSets.length) {
    ({ error: setsDeleteError } = await supabase
      .from("sets")
      .delete()
      .in(
        "id",
        deletedSets.map((s) => s.id),
      ));
    if (setsDeleteError) {
      console.error("Error deleting sets remotely:", setsDeleteError);
    }
  }

  if (!exercisesDeleteError) {
    await db.exercises.bulkDelete(deletedExercises.map((e) => e.id));
  }
  if (!setsDeleteError) {
    await db.sets.bulkDelete(deletedSets.map((s) => s.id));
  }

  // -----------------------------
  // 2. PULL remote changes
  // -----------------------------
  const { data: remoteWorkouts } = await supabase
    .from("workouts")
    .select("*")
    .gt("updated_at", lastSynced);

  const { data: remoteExercises } = await supabase
    .from("exercises")
    .select("*")
    .gt("updated_at", lastSynced);

  const { data: remoteSets } = await supabase
    .from("sets")
    .select("*")
    .gt("updated_at", lastSynced);

  // Insert or update (or delete) locally
  // decided to only do this for workouts as it's a decent amount of logic
  // and I think that only the workouts have a real risk of this
  remoteWorkouts?.forEach(async (w: Workout) => {
    if (w.deleted_at) {
      await db.workouts.delete(w.id);
    } else {
      await db.workouts.put({ ...w, synced: true });
    }
  });
  await db.exercises.bulkPut(
    remoteExercises?.map((e) => ({ ...e, synced: true })) ?? [],
  );
  await db.sets.bulkPut(remoteSets?.map((s) => ({ ...s, synced: true })) ?? []);

  // -----------------------------
  // 3. Write new timestamp
  // -----------------------------
  await db.metadata.put({
    key: "lastSyncedAt",
    value: new Date().toISOString(),
  });

  return { workouts: await db.workouts.toArray() };
}
