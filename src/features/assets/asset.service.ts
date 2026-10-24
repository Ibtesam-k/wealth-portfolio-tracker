import { Prisma } from "@/generated/prisma/client";
import * as assetRepository from "./asset.repository";
import {
  validateAssetInput,
  validateLedgerTransaction,
} from "./asset.validation";
import {
  calculateCashBalance,
  calculateCurrentRecordedValue,
  calculateTradableHoldings,
  hasSufficientHoldings,
} from "./asset.calculations";

export class AssetServiceError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 404 | 409,
  ) {
    super(message);
    this.name = "AssetServiceError";
  }
}

async function requireMembership(userId: string, portfolioId: string) {
  if (!userId.trim()) {
    throw new AssetServiceError("Unauthorized", 403);
  }

  const membership = await assetRepository.findMembership(userId, portfolioId);
  if (!membership) {
    throw new AssetServiceError("Portfolio not found", 404);
  }
  return membership;
}

function serializeAsset(asset: Awaited<ReturnType<typeof assetRepository.listForPortfolio>>[number]) {
  const cashBalance =
    asset.type === "CASH"
      ? calculateCashBalance(asset.transactions, new Prisma.Decimal(0)).toString()
      : undefined;
  const latestValuation = asset.valuations[0];
  const holdings = asset.tradable
    ? calculateTradableHoldings(asset.transactions, new Prisma.Decimal(0))
    : undefined;
  const currentRecordedValue = holdings !== undefined && asset.tradable
    ? calculateCurrentRecordedValue(holdings, asset.tradable.currentPrice)
    : undefined;

  return {
    id: asset.id,
    portfolioId: asset.portfolioId,
    name: asset.name,
    type: asset.type,
    currency: asset.currency,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    ...(asset.tradable
      ? {
          symbol: asset.tradable.symbol,
          currentPrice: asset.tradable.currentPrice.toString(),
          currentHoldings: holdings?.toString(),
          currentRecordedValue: currentRecordedValue?.toString(),
        }
      : {}),
    ...(cashBalance !== undefined ? { cashBalance } : {}),
    ...(latestValuation
      ? {
          estimatedValue: latestValuation.estimatedValue.toString(),
          valuationEffectiveAt: latestValuation.effectiveAt,
        }
      : {}),
    transactions: asset.transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      occurredAt: transaction.occurredAt,
      createdAt: transaction.createdAt,
      note: transaction.note,
      quantity: transaction.quantity?.toString() ?? null,
      unitPrice: transaction.unitPrice?.toString() ?? null,
      amount: transaction.amount?.toString() ?? null,
    })),
  };
}

export async function listAssets(userId: string, portfolioId: string) {
  await requireMembership(userId, portfolioId);

  const assets = await assetRepository.listForPortfolio(portfolioId);

  return assets.map(serializeAsset);
}
export async function createAsset(
  userId: string,
  portfolioId: string,
  input: unknown,
) {
  const membership = await requireMembership(userId, portfolioId);
  if (!assetRepository.canManageAssets(membership.role)) {
    throw new AssetServiceError("You do not have permission to add assets", 403);
  }

  const validation = validateAssetInput(input);
  if (!validation.success) {
    throw new AssetServiceError(validation.error, 400);
  }

  const asset = await assetRepository.createForPortfolio(portfolioId, validation.data);
  return {
    id: asset.id,
    portfolioId: asset.portfolioId,
    name: asset.name,
    type: asset.type,
    currency: asset.currency,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    ...(asset.tradable
      ? {
          symbol: asset.tradable.symbol,
          currentPrice: asset.tradable.currentPrice.toString(),
        }
      : {}),
    initialTransaction: asset.transactions[0]
      ? {
          ...asset.transactions[0],
          quantity: asset.transactions[0].quantity?.toString() ?? null,
          unitPrice: asset.transactions[0].unitPrice?.toString() ?? null,
          amount: asset.transactions[0].amount?.toString() ?? null,
        }
      : null,
    initialValuation: asset.valuations[0]
      ? {
          ...asset.valuations[0],
          estimatedValue: asset.valuations[0].estimatedValue.toString(),
        }
      : null,
  };
}

export async function createLedgerEntry(
  userId: string,
  portfolioId: string,
  assetId: string,
  input: unknown,
) {
  const membership = await requireMembership(userId, portfolioId);
  if (!assetRepository.canManageAssets(membership.role)) {
    throw new AssetServiceError("You do not have permission to manage this asset", 403);
  }

  const asset = await assetRepository.findAssetForPortfolio(assetId, portfolioId);
  if (!asset) {
    throw new AssetServiceError("Asset not found", 404);
  }

  const validation = validateLedgerTransaction(asset.type, input);
  if (!validation.success) {
    throw new AssetServiceError(validation.error, 400);
  }

  const entry = validation.data;
  const amount = entry.type === "BUY" || entry.type === "SELL"
    ? new Prisma.Decimal(entry.quantity!).times(new Prisma.Decimal(entry.unitPrice!)).toString()
    : entry.amount;

  return assetRepository.inAssetTransaction(async (transaction) => {
    await assetRepository.lockAssetForUpdate(assetId, transaction);

    if (
      entry.type === "OPENING_BALANCE" &&
      (await assetRepository.hasOpeningBalance(assetId, transaction))
    ) {
      throw new AssetServiceError("An opening balance already exists", 409);
    }

    if (entry.type === "SELL") {
      const transactions = await assetRepository.listTradableTransactions(assetId, transaction);
      const holdings = calculateTradableHoldings(
        transactions,
        new Prisma.Decimal(0),
      );
      const requestedQuantity = new Prisma.Decimal(entry.quantity!);

      if (!hasSufficientHoldings(holdings, requestedQuantity)) {
        throw new AssetServiceError("Sell quantity exceeds current holdings", 409);
      }
    }

    return assetRepository.createLedgerTransaction(assetId, entry, amount, transaction);
  });
}

export async function deleteAsset(
  userId: string,
  portfolioId: string,
  assetId: string,
) {
  const membership = await requireMembership(userId, portfolioId);

  if (!assetRepository.canManageAssets(membership.role)) {
    throw new AssetServiceError(
      "You do not have permission to delete this asset",
      403,
    );
  }

  const asset = await assetRepository.findAssetForPortfolio(
    assetId,
    portfolioId,
  );

  if (!asset) {
    throw new AssetServiceError("Asset not found", 404);
  }

  await assetRepository.deleteForPortfolio(assetId, portfolioId);
}