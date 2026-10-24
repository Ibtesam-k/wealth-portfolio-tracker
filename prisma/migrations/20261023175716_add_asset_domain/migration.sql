-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'CRYPTO', 'CASH', 'REAL_ESTATE');

-- CreateEnum
CREATE TYPE "AssetTransactionType" AS ENUM ('BUY', 'SELL', 'OPENING_BALANCE', 'DEPOSIT', 'WITHDRAWAL', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "asset" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "AssetType" NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tradable_asset" (
    "assetId" TEXT NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "currentPrice" DECIMAL(20,8) NOT NULL,

    CONSTRAINT "tradable_asset_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "cash_account" (
    "assetId" TEXT NOT NULL,

    CONSTRAINT "cash_account_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "real_estate_asset" (
    "assetId" TEXT NOT NULL,

    CONSTRAINT "real_estate_asset_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "asset_transaction" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "AssetTransactionType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" VARCHAR(500),
    "quantity" DECIMAL(28,10),
    "unitPrice" DECIMAL(20,8),
    "amount" DECIMAL(38,18),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_valuation" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "estimatedValue" DECIMAL(38,18) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_valuation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_portfolioId_idx" ON "asset"("portfolioId");

-- CreateIndex
CREATE INDEX "asset_transaction_assetId_occurredAt_idx" ON "asset_transaction"("assetId", "occurredAt");

-- CreateIndex
CREATE INDEX "asset_transaction_assetId_type_idx" ON "asset_transaction"("assetId", "type");

-- CreateIndex
CREATE INDEX "asset_valuation_assetId_effectiveAt_createdAt_idx" ON "asset_valuation"("assetId", "effectiveAt", "createdAt");

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tradable_asset" ADD CONSTRAINT "tradable_asset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_account" ADD CONSTRAINT "cash_account_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_asset" ADD CONSTRAINT "real_estate_asset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transaction" ADD CONSTRAINT "asset_transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_valuation" ADD CONSTRAINT "asset_valuation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
