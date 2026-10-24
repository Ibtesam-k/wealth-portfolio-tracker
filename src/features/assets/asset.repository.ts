import type {
  PortfolioRole,
  Prisma,
} from "@/generated/prisma/client";
import { Prisma as PrismaRuntime } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AssetInput, LedgerTransactionInput } from "./asset.validation";

type DbClient = Prisma.TransactionClient;

export async function findMembership(userId: string, portfolioId: string) {
  return prisma.portfolioMember.findUnique({
    where: { portfolioId_userId: { portfolioId, userId } },
    select: { role: true },
  });
}

export async function listForPortfolio(portfolioId: string) {
  return prisma.asset.findMany({
    where: { portfolioId },
    select: {
      id: true,
      portfolioId: true,
      name: true,
      type: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
      tradable: { select: { symbol: true, currentPrice: true } },
      transactions: {
        where: { amount: { not: null } },
        select: { type: true, amount: true },
      },
      valuations: {
        orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { estimatedValue: true, effectiveAt: true },
      },
      cashAccount: { select: { assetId: true } },
      realEstate: {
        select: {
          assetId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createForPortfolio(portfolioId: string, input: AssetInput) {
  return prisma.$transaction(async (transaction) => {
    const initialTransaction = input.initialBuy ?? input.openingBalance;
    const initialAmount = input.initialBuy
      ? new PrismaRuntime.Decimal(input.initialBuy.quantity).times(
          new PrismaRuntime.Decimal(input.initialBuy.unitPrice),
        )
      : input.openingBalance
        ? new PrismaRuntime.Decimal(input.openingBalance.amount)
        : undefined;

    return transaction.asset.create({
      data: {
        portfolioId,
        name: input.name,
        type: input.type,
        currency: input.currency,
        ...(input.type === "STOCK" || input.type === "CRYPTO"
          ? {
              tradable: {
                create: {
                  symbol: input.symbol!,
                  currentPrice: input.currentPrice!,
                },
              },
            }
          : input.type === "CASH"
            ? { cashAccount: { create: {} } }
            : { realEstate: { create: {} } }),
        ...(initialTransaction && initialAmount
          ? {
              transactions: {
                create: {
                  type: input.initialBuy ? "BUY" : "OPENING_BALANCE",
                  occurredAt: initialTransaction.occurredAt,
                  note: initialTransaction.note,
                  quantity: "quantity" in initialTransaction
                    ? initialTransaction.quantity
                    : undefined,
                  unitPrice: "unitPrice" in initialTransaction
                    ? initialTransaction.unitPrice
                    : undefined,
                  amount: initialAmount,
                },
              },
            }
          : {}),
        ...(input.initialValuation
          ? {
              valuations: {
                create: {
                  estimatedValue: input.initialValuation.estimatedValue,
                  effectiveAt: input.initialValuation.effectiveAt,
                  note: input.initialValuation.note,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        portfolioId: true,
        name: true,
        type: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        tradable: { select: { symbol: true, currentPrice: true } },
        cashAccount: { select: { assetId: true } },
        realEstate: { select: { assetId: true } },
        transactions: {
          select: {
            id: true,
            type: true,
            occurredAt: true,
            note: true,
            quantity: true,
            unitPrice: true,
            amount: true,
          },
        },
        valuations: {
          select: {
            id: true,
            estimatedValue: true,
            effectiveAt: true,
            createdAt: true,
          },
        },
      },
    });
  });
}

export async function findAssetForPortfolio(assetId: string, portfolioId: string) {
  return prisma.asset.findFirst({
    where: { id: assetId, portfolioId },
    select: { id: true, type: true },
  });
}

export async function hasOpeningBalance(
  assetId: string,
  client: DbClient = prisma,
) {
  return client.transaction.findFirst({
    where: { assetId, type: "OPENING_BALANCE" },
    select: { id: true },
  });
}

export async function createLedgerTransaction(
  assetId: string,
  input: LedgerTransactionInput,
  amount: string | undefined,
  client: DbClient = prisma,
) {
  return client.transaction.create({
    data: {
      assetId,
      type: input.type,
      occurredAt: input.occurredAt,
      note: input.note,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      amount,
    },
  });
}

export async function inSerializableTransaction<T>(
  operation: (client: DbClient) => Promise<T>,
) {
  return prisma.$transaction(operation, { isolationLevel: "Serializable" });
}

export function canManageAssets(role: PortfolioRole) {
  return role === "OWNER" || role === "EDITOR";
}

export async function findInitialBuy(assetId: string) {
  return prisma.transaction.findFirst({
    where: {
      assetId,
      type: "BUY",
      quantity: { not: null },
      unitPrice: { not: null },
      amount: { not: null },
    },
    orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
    select: {
      type: true,
      quantity: true,
      unitPrice: true,
      amount: true,
      occurredAt: true,
    },
  });
}