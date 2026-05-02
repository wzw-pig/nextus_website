-- CreateEnum
CREATE TYPE "FloorTimeSlot" AS ENUM ('S0800_1000', 'S1000_1200', 'S1200_1400', 'S1400_1600', 'S1600_1800', 'S1800_2000', 'S2000_2200');

-- CreateTable
CREATE TABLE "FloorReservation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "slot" "FloorTimeSlot" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FloorReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FloorReservation_date_idx" ON "FloorReservation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FloorReservation_date_slot_key" ON "FloorReservation"("date", "slot");

-- AddForeignKey
ALTER TABLE "FloorReservation" ADD CONSTRAINT "FloorReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IntranetUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
