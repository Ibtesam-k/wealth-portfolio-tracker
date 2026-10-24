import { prisma } from "@/lib/prisma";

export async function listForUser(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: { userId },
        select: { role: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return portfolios;
}

export async function createForUser(userId: string, name: string) {
  return prisma.portfolio.create({
    data: {
      name,
      members: {
        create: {
          role: "OWNER",
          user: {
            connect: { id: userId },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
}


type PortfolioSummaryRow = {
  portfolio_id: string;
  portfolio_name: string;
  role: string;
  asset_count: number;
  stock_count: number;
  crypto_count: number;
  cash_count: number;
  real_estate_count: number;
  currency: string | null;
  total_value: string | null;
};

export async function listPortfolioSummariesForUser(
  userId: string,
): Promise<PortfolioSummaryRow[]> {
  return prisma.$queryRaw<PortfolioSummaryRow[]>`
    WITH user_portfolios AS (
      SELECT
        p.id,
        p.name,
        pm.role
      FROM portfolio p
      INNER JOIN portfolio_member pm
        ON pm."portfolioId" = p.id
      WHERE pm."userId" = ${userId}
    ),
    asset_metrics AS (
      SELECT
        a.id,
        a."portfolioId" AS portfolio_id,
        a.type,
        a.currency,
        ta."currentPrice" AS current_price,

        COALESCE(
          (
            SELECT SUM(
              CASE
                WHEN t.type = 'BUY' THEN t.quantity
                WHEN t.type = 'SELL' THEN -t.quantity
                ELSE 0::numeric
              END
            )
            FROM asset_transaction t
            WHERE t."assetId" = a.id
          ),
          0::numeric
        ) AS holdings,

        COALESCE(
          (
            SELECT SUM(
              CASE
                WHEN t.type = 'WITHDRAWAL' THEN -t.amount
                ELSE t.amount
              END
            )
            FROM asset_transaction t
            WHERE t."assetId" = a.id
          ),
          0::numeric
        ) AS cash_balance,

        (
          SELECT v."estimatedValue"
          FROM asset_valuation v
          WHERE v."assetId" = a.id
          ORDER BY v."effectiveAt" DESC, v."createdAt" DESC
          LIMIT 1
        ) AS latest_valuation

      FROM asset a
      INNER JOIN user_portfolios up
        ON up.id = a."portfolioId"
      LEFT JOIN tradable_asset ta
        ON ta."assetId" = a.id
    ),
    valued_assets AS (
      SELECT
        portfolio_id,
        type,
        currency,
        CASE
          WHEN type IN ('STOCK', 'CRYPTO')
            THEN holdings * COALESCE(current_price, 0::numeric)
          WHEN type = 'CASH'
            THEN cash_balance
          WHEN type = 'REAL_ESTATE'
            THEN COALESCE(latest_valuation, 0::numeric)
          ELSE 0::numeric
        END AS current_value
      FROM asset_metrics
    ),
    portfolio_counts AS (
      SELECT
        portfolio_id,
        COUNT(*)::int AS asset_count,
        COUNT(*) FILTER (WHERE type = 'STOCK')::int AS stock_count,
        COUNT(*) FILTER (WHERE type = 'CRYPTO')::int AS crypto_count,
        COUNT(*) FILTER (WHERE type = 'CASH')::int AS cash_count,
        COUNT(*) FILTER (WHERE type = 'REAL_ESTATE')::int
          AS real_estate_count
      FROM valued_assets
      GROUP BY portfolio_id
    ),
    currency_totals AS (
      SELECT
        portfolio_id,
        currency,
        SUM(current_value) AS total_value
      FROM valued_assets
      GROUP BY portfolio_id, currency
    )
    SELECT
      up.id AS portfolio_id,
      up.name AS portfolio_name,
      up.role::text AS role,
      COALESCE(pc.asset_count, 0)::int AS asset_count,
      COALESCE(pc.stock_count, 0)::int AS stock_count,
      COALESCE(pc.crypto_count, 0)::int AS crypto_count,
      COALESCE(pc.cash_count, 0)::int AS cash_count,
      COALESCE(pc.real_estate_count, 0)::int AS real_estate_count,
      ct.currency,
      ct.total_value::text AS total_value
    FROM user_portfolios up
    LEFT JOIN portfolio_counts pc
      ON pc.portfolio_id = up.id
    LEFT JOIN currency_totals ct
      ON ct.portfolio_id = up.id
    ORDER BY up.name ASC, ct.currency ASC
  `;
}


export async function listMembers(portfolioId: string) {
  return prisma.portfolioMember.findMany({
    where: { portfolioId },
    select: {
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true },
  });
}

export async function addMember(
  portfolioId: string,
  userId: string,
  role: "OWNER" | "EDITOR" | "VIEWER",
) {
  return prisma.portfolioMember.create({
    data: { portfolioId, userId, role },
  });
}

export async function removeMember(
  portfolioId: string,
  userId: string,
) {
  return prisma.portfolioMember.deleteMany({
    where: { portfolioId, userId },
  });
}


export async function findMembership(
  portfolioId: string,
  userId: string,
) {
  return prisma.portfolioMember.findUnique({
    where: {
      portfolioId_userId: {
        portfolioId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });
}