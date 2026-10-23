-- CreateEnum
CREATE TYPE "PortfolioRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "portfolio" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_member" (
    "portfolioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PortfolioRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_member_pkey" PRIMARY KEY ("portfolioId","userId")
);

-- CreateIndex
CREATE INDEX "portfolio_member_userId_idx" ON "portfolio_member"("userId");

-- AddForeignKey
ALTER TABLE "portfolio_member" ADD CONSTRAINT "portfolio_member_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_member" ADD CONSTRAINT "portfolio_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
