-- AlterTable: BodyMetric
-- Add new columns (weightLb nullable for now, so this is safe on a populated table)
ALTER TABLE "BodyMetric"
ADD COLUMN     "bmi" DOUBLE PRECISION,
ADD COLUMN     "bmr" INTEGER,
ADD COLUMN     "bodyWaterPct" DOUBLE PRECISION,
ADD COLUMN     "boneMassLb" DOUBLE PRECISION,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "fatFreeMassLb" DOUBLE PRECISION,
ADD COLUMN     "hipIn" DOUBLE PRECISION,
ADD COLUMN     "metabolicAge" INTEGER,
ADD COLUMN     "muscleMassLb" DOUBLE PRECISION,
ADD COLUMN     "neckIn" DOUBLE PRECISION,
ADD COLUMN     "proteinPct" DOUBLE PRECISION,
ADD COLUMN     "skeletalMusclePct" DOUBLE PRECISION,
ADD COLUMN     "subcutaneousFatPct" DOUBLE PRECISION,
ADD COLUMN     "visceralFatLevel" DOUBLE PRECISION,
ADD COLUMN     "waistIn" DOUBLE PRECISION,
ADD COLUMN     "weightLb" DOUBLE PRECISION;

-- Backfill weightLb from weightKg (unit conversion), preserving any existing data
UPDATE "BodyMetric" SET "weightLb" = "weightKg" * 2.2046226218 WHERE "weightKg" IS NOT NULL;

-- Now that every row has weightLb, it's safe to enforce NOT NULL and drop the old column
ALTER TABLE "BodyMetric" ALTER COLUMN "weightLb" SET NOT NULL;
ALTER TABLE "BodyMetric" DROP COLUMN "weightKg";

-- AlterTable: InBodyScan
ALTER TABLE "InBodyScan"
ADD COLUMN     "bodyCellMassLb" DOUBLE PRECISION,
ADD COLUMN     "bodyFatMassLb" DOUBLE PRECISION,
ADD COLUMN     "ecwRatio" DOUBLE PRECISION,
ADD COLUMN     "extracellularWaterL" DOUBLE PRECISION,
ADD COLUMN     "inBodyScore" INTEGER,
ADD COLUMN     "intracellularWaterL" DOUBLE PRECISION,
ADD COLUMN     "leftArmFatLb" DOUBLE PRECISION,
ADD COLUMN     "leftArmLeanLb" DOUBLE PRECISION,
ADD COLUMN     "leftArmLeanPct" DOUBLE PRECISION,
ADD COLUMN     "leftLegFatLb" DOUBLE PRECISION,
ADD COLUMN     "leftLegLeanLb" DOUBLE PRECISION,
ADD COLUMN     "leftLegLeanPct" DOUBLE PRECISION,
ADD COLUMN     "phaseAngle" DOUBLE PRECISION,
ADD COLUMN     "rightArmFatLb" DOUBLE PRECISION,
ADD COLUMN     "rightArmLeanLb" DOUBLE PRECISION,
ADD COLUMN     "rightArmLeanPct" DOUBLE PRECISION,
ADD COLUMN     "rightLegFatLb" DOUBLE PRECISION,
ADD COLUMN     "rightLegLeanLb" DOUBLE PRECISION,
ADD COLUMN     "rightLegLeanPct" DOUBLE PRECISION,
ADD COLUMN     "skeletalMuscleMassLb" DOUBLE PRECISION,
ADD COLUMN     "smi" DOUBLE PRECISION,
ADD COLUMN     "totalBodyWaterL" DOUBLE PRECISION,
ADD COLUMN     "trunkFatLb" DOUBLE PRECISION,
ADD COLUMN     "trunkLeanLb" DOUBLE PRECISION,
ADD COLUMN     "trunkLeanPct" DOUBLE PRECISION,
ADD COLUMN     "weightLb" DOUBLE PRECISION;

-- Backfill weight + mass fields with unit conversion, preserving existing data
UPDATE "InBodyScan" SET "weightLb" = "weightKg" * 2.2046226218 WHERE "weightKg" IS NOT NULL;
UPDATE "InBodyScan" SET "skeletalMuscleMassLb" = "skeletalMuscleMassKg" * 2.2046226218 WHERE "skeletalMuscleMassKg" IS NOT NULL;
UPDATE "InBodyScan" SET "bodyFatMassLb" = "bodyFatMassKg" * 2.2046226218 WHERE "bodyFatMassKg" IS NOT NULL;

ALTER TABLE "InBodyScan" ALTER COLUMN "weightLb" SET NOT NULL;
ALTER TABLE "InBodyScan" DROP COLUMN "weightKg",
DROP COLUMN "skeletalMuscleMassKg",
DROP COLUMN "bodyFatMassKg";
