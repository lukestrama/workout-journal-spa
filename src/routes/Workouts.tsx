"use client";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/react-router";
import { useWorkouts } from "@/lib/hooks/useWorkouts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Spinner from "../components/Spinner";
import Dialog from "../components/Dialog";
import { db } from "@/lib/db";
import { useEffect } from "react";
import { SyncButton } from "../components/SyncButton";

export default function WorkoutsPage() {
  const { user } = useUser();
  const { workouts, deleteWorkout, loading, initialDataSync, refreshWorkouts } =
    useWorkouts();

  // Initialize IndexedDB when user logs in
  useEffect(() => {
    const initializeDatabase = async () => {
      if (!user?.id) return;

      try {
        // Initialize database first
        await db.open();

        const hasSyncedBefore = await db.metadata.get("initialSyncDone");

        if (!hasSyncedBefore) {
          await initialDataSync();
          await db.metadata.put({
            key: "initialSyncDone",
            value: "true",
          });
        }
      } catch (error) {
        console.error("Database initialization failed:", error);
      }
    };

    initializeDatabase();
  }, [user?.id, initialDataSync]);

  const handleDeleteWorkout = (
    e: React.MouseEvent<HTMLButtonElement>,
    workoutId: number
  ) => {
    e.preventDefault();
    deleteWorkout(workoutId);
  };

  return (
    <main className="p-6">
      {!user ? (
        <div className="flex justify-center items-center text-2xl mt-8">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="flex sm:justify-between  flex-col">
            <h1 className="text-2xl font-bold mb-3">My Workouts</h1>
            <div className="gap-4 flex w-full justify-between">
              <div className="flex-1">
                <SyncButton onSyncComplete={refreshWorkouts} />
              </div>
              <Button className="flex-1" asChild>
                <Link to="/add">Add workout</Link>
              </Button>
            </div>
          </div>
          {workouts.length === 0 ? (
            loading ? (
              <div className="flex justify-center items-center text-2xl mt-8">
                <Spinner />
              </div>
            ) : (
              <p>No workouts yet. Add one!</p>
            )
          ) : (
            <ul className="space-y-2">
              {workouts.map((w) => (
                <li key={w.id} className="my-4">
                  <div className="relative">
                    <Link to={`/workouts/${w.id}`} className="text-lg flex-1">
                      <Card>
                        <CardHeader className="flex justify-between">
                          <div>
                            <CardTitle>{w.title}</CardTitle>
                            <CardDescription>{w.date}</CardDescription>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                    <Dialog
                      triggerClasses="absolute right-[20px] top-[30%]"
                      buttonText="Delete"
                      titleText="Delete workout?"
                      triggerButtonVariant={"destructive"}
                    >
                      <div className="text-center">
                        <p className="mb-3 text-lg">
                          Are you sure you want to delete your workout?
                        </p>
                        <Button
                          onClick={(e) => handleDeleteWorkout(e, w.id)}
                          variant={"destructive"}
                        >
                          Delete
                        </Button>
                      </div>
                    </Dialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
