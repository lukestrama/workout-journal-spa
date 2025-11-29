"use client";

import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { syncWithSupabase } from "@/lib/supabase/sync";
import { useState } from "react";

interface SyncButtonProps {
  onSyncComplete?: () => Promise<void>;
}

export function SyncButton({ onSyncComplete }: SyncButtonProps = {}) {
  const [loading, setLoading] = useState(false);
  const { supabase } = useSupabase();

  async function handleSync() {
    setLoading(true);
    try {
      await syncWithSupabase(supabase!);
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
      disabled={loading}
    >
      {loading ? "Syncing..." : "Sync Now"}
    </Button>
  );
}
