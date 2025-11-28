import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ClerkProvider } from "@clerk/react-router";
import { BrowserRouter, Routes, Route } from "react-router";
import RootLayout from "./routes/RootLayout.tsx";
import Home from "./routes/Home.tsx";
import Workouts from "./routes/Workouts.tsx";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/workouts" element={<Workouts />} />
            {/* <Route path="/workouts/:id" element={<WorkoutDetail />} /> */}
          </Route>
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>
);
