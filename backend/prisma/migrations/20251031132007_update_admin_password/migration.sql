/*
  Warnings:

  - A unique constraint covering the columns `[adminId]` on the table `barbers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."barbers" DROP CONSTRAINT "barbers_adminId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "barbers_adminId_key" ON "barbers"("adminId");

-- AddForeignKey
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
