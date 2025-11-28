"use client";

import { Button } from "@/components/ui/button";
import { useWorkouts } from "@/lib/hooks/useWorkouts";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { syncWithSupabase } from "@/lib/supabase/sync";
import { useState } from "react";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const { supabase } = useSupabase();
  const { setWorkouts } = useWorkouts();

  async function handleSync() {
    setLoading(true);
    const { workouts } = await syncWithSupabase(supabase!);
    setWorkouts(workouts);
    setLoading(false);
  }

  return (
    <Button variant={"secondary"} onClick={handleSync} disabled={loading}>
      {loading ? "Syncing..." : "Sync Now"}
    </Button>
  );
}
