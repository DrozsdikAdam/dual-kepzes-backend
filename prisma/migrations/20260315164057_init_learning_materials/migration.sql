-- CreateTable
CREATE TABLE "MaterialCompletion" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT true,
    "rating" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialCompletion_studentProfileId_materialId_key" ON "MaterialCompletion"("studentProfileId", "materialId");

-- AddForeignKey
ALTER TABLE "MaterialCompletion" ADD CONSTRAINT "MaterialCompletion_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
