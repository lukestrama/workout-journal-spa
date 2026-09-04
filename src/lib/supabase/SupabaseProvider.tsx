import { createContext, useContext, useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/react-router";

type SupabaseContext = {
  supabase: SupabaseClient | null;
  isLoaded: boolean;
};
const Context = createContext<SupabaseContext>({
  supabase: null,
  isLoaded: false,
});

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoaded: sessionLoaded } = useSession();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    if (!session) {
      // Signed out (or session not yet resolved): drop any stale client.
      setSupabase(null);
      return;
    }
    const client = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      {
        accessToken: () => session.getToken(),
      }
    );
    setSupabase(client);
  }, [session]);

  // Ready once Clerk has resolved the session state and, when signed in, the
  // Supabase client has actually been created. Consumers must not touch
  // `supabase` until this is true.
  const isLoaded = sessionLoaded && (!session || supabase !== null);

  return (
    <Context.Provider value={{ supabase, isLoaded }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase needs to be inside the provider");
  }

  return context;
};
