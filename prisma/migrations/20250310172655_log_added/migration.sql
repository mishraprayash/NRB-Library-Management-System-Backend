-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateTable
CREATE TABLE "Logs" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "affectedIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "module" TEXT,
    "meta" JSONB NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Logs_id_key" ON "Logs"("id");
