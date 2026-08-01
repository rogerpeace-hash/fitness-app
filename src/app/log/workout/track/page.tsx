import Link from "next/link";
import { requireUserId } from "@/lib/auth-helpers";
import Tracker from "./Tracker";

export default async function TrackWorkoutPage() {
  await requireUserId();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Record a walk or run</h1>
        <Link href="/log/workout" className="text-sm text-dim hover:text-ignite">
          Back to workouts
        </Link>
      </div>
      <Tracker />
    </div>
  );
}
