import Link from "next/link";
import { requireUserId } from "@/lib/auth-helpers";
import Tracker from "./Tracker";

export default async function TrackWorkoutPage() {
  await requireUserId();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Record a walk or run</h1>
        <Link href="/log/workout" className="text-sm text-slate-500 underline hover:text-blue-600 dark:hover:text-blue-400">
          Back to workouts
        </Link>
      </div>
      <Tracker />
    </div>
  );
}
