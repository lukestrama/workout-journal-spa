"use client";

import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { useUser } from "@clerk/react-router";
import { syncWithSupabase } from "@/lib/supabase/sync";
import { useState } from "react";

interface SyncButtonProps {
  onSyncComplete?: () => Promise<void>;
}

export function SyncButton({ onSyncComplete }: SyncButtonProps = {}) {
  const [loading, setLoading] = useState(false);
  const { supabase } = useSupabase();
  const { user } = useUser();

  async function handleSync() {
    if (!supabase) return;
    setLoading(true);
    try {
      await syncWithSupabase(supabase, user?.id);
      await onSyncComplete?.();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      className="w-full"
      variant={"secondary"}
      onClick={handleSync}
      disabled={loading || !supabase}
    >
      {loading ? "Syncing..." : "Sync Now"}
    </Button>
  );
}
