import LandingPage from "@/components/LandingPage";
import Spinner from "@/components/Spinner";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router";

export default function Home() {
  const { user, isLoaded } = useUser();
  return isLoaded ? (
    user ? (
      <Navigate to="/workouts" />
    ) : (
      <LandingPage />
    )
  ) : (
    <Spinner />
  );
}
