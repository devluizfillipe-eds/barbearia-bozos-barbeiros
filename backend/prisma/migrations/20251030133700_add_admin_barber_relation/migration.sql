-- AlterTable
ALTER TABLE "barbers" ADD COLUMN "adminId" INTEGER REFERENCES "admins"(id);

-- CreateIndex
CREATE INDEX "barbers_adminId_idx" ON "barbers"("adminId");