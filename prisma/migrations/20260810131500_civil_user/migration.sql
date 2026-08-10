-- CreateTable
CREATE TABLE "CivilUser" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "om" TEXT NOT NULL DEFAULT 'HARF',
    "postoGrad" TEXT NOT NULL DEFAULT 'Civil',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivilUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CivilUser_cpf_key" ON "CivilUser"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "CivilUser_userId_key" ON "CivilUser"("userId");

-- AddForeignKey
ALTER TABLE "CivilUser" ADD CONSTRAINT "CivilUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
