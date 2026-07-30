-- AlterEnum
ALTER TYPE "GoalType" ADD VALUE 'EXERCISE_REPS';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "exerciseName" TEXT;

-- CreateTable
CREATE TABLE "FluidLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "drinkType" TEXT NOT NULL,
    "amountOz" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FluidLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalProgressLog" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalProgressLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FluidLog_userId_date_idx" ON "FluidLog"("userId", "date");

-- CreateIndex
CREATE INDEX "GoalProgressLog_goalId_date_idx" ON "GoalProgressLog"("goalId", "date");

-- AddForeignKey
ALTER TABLE "FluidLog" ADD CONSTRAINT "FluidLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgressLog" ADD CONSTRAINT "GoalProgressLog_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
