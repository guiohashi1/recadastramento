-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SourceSheet" AS ENUM ('ATIVA', 'PTTC', 'MANUAL');

-- CreateEnum
CREATE TYPE "PersonnelStatus" AS ENUM ('MILITAR_DA_ATIVA', 'RESERVA_REMUNERADA', 'CIVIL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "saram" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "postoGrad" TEXT,
    "quadro" TEXT,
    "especialidade" TEXT,
    "sourceSheet" "SourceSheet" NOT NULL DEFAULT 'MANUAL',
    "setorHint" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PersonnelStatus" NOT NULL,
    "setorAd" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "identidade" TEXT,
    "termoSnapshot" JSONB NOT NULL,
    "pastasAd" TEXT[],
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "pdfGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_saram_key" ON "User"("saram");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_sourceSheet_idx" ON "User"("sourceSheet");

-- CreateIndex
CREATE INDEX "Submission_userId_isCurrent_idx" ON "Submission"("userId", "isCurrent");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
