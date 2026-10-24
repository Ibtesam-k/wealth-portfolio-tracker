import { Prisma } from "@/generated/prisma/client";
import * as assetRepository from "./asset.repository";
import {
  validateAssetInput,
  validateLedgerTransaction,
} from "./asset.validation";

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

function decimalSum(values: ({ amount: Prisma.Decimal | null; type: string } | null)[]) {
  return values.reduce((sum, transaction) => {
    if (!transaction?.amount) return sum;
    const signedAmount =
      transaction.type === "WITHDRAWAL" ? transaction.amount.negated() : transaction.amount;
    return sum.plus(signedAmount);
  }, new Prisma.Decimal(0));
}

function serializeAsset(asset: Awaited<ReturnType<typeof assetRepository.listForPortfolio>>[number]) {
  const cashBalance =
    asset.type === "CASH"
      ? decimalSum(asset.transactions).toString()
      : undefined;
  const latestValuation = asset.valuations[0];

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
    ...(cashBalance !== undefined ? { cashBalance } : {}),
    ...(latestValuation
      ? {
          estimatedValue: latestValuation.estimatedValue.toString(),
          valuationEffectiveAt: latestValuation.effectiveAt,
        }
      : {}),
  };
}

export async function listAssets(userId: string, portfolioId: string) {
  await requireMembership(userId, portfolioId);

  const assets = await assetRepository.listForPortfolio(portfolioId);

  return Promise.all(
    assets.map(async (asset) => {
      const serialized = serializeAsset(asset);

      if (asset.type !== "STOCK" && asset.type !== "CRYPTO") {
        return serialized;
      }

      const initialBuy = await assetRepository.findInitialBuy(asset.id);

      return {
        ...serialized,
        initialBuy: initialBuy
          ? {
              type: initialBuy.type,
              quantity: initialBuy.quantity?.toString() ?? null,
              unitPrice: initialBuy.unitPrice?.toString() ?? null,
              amount: initialBuy.amount?.toString() ?? null,
              occurredAt: initialBuy.occurredAt,
            }
          : null,
      };
    }),
  );
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

  try {
    return await assetRepository.inSerializableTransaction(async (transaction) => {
      if (
        entry.type === "OPENING_BALANCE" &&
        (await assetRepository.hasOpeningBalance(assetId, transaction))
      ) {
        throw new AssetServiceError("An opening balance already exists", 409);
      }
      return assetRepository.createLedgerTransaction(assetId, entry, amount, transaction);
    });
  } catch (error) {
    if (error instanceof AssetServiceError) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new AssetServiceError("Could not safely record this transaction; retry", 409);
    }
    throw error;
  }
}