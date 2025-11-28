import { Outlet } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import SupabaseProvider from "@/lib/supabase/SupabaseProvider";

export default function RootLayout() {
  return (
    <>
      <SupabaseProvider>
        <header className="flex justify-end items-center p-4 gap-4 h-16 w-full bg-secondary">
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
        <Outlet />
      </SupabaseProvider>
    </>
  );
}
