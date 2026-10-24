import * as portfolioRepository from "./portfolio.repository";
import { validatePortfolioName } from "./portfolio.validation";

function requireUserId(userId: string): string {
  if (!userId.trim()) {
    throw new Error("An authenticated user ID is required");
  }

  return userId;
}

export async function listPortfoliosForUser(userId: string) {
  const authenticatedUserId = requireUserId(userId);
  const portfolios = await portfolioRepository.listForUser(authenticatedUserId);

  return portfolios.map(({ members, ...portfolio }) => ({
    ...portfolio,
    role: members[0]?.role ?? null,
  }));
}

export async function createPortfolioForUser(userId: string, input: unknown) {
  const authenticatedUserId = requireUserId(userId);
  const validation = validatePortfolioName(input);

  if (!validation.success) {
    return validation;
  }

  const portfolio = await portfolioRepository.createForUser(
    authenticatedUserId,
    validation.name,
  );
  const { members, ...portfolioData } = portfolio;

  return {
    success: true as const,
    portfolio: {
      ...portfolioData,
      role: members[0]?.role ?? null,
    },
  };
}


export async function getPortfolioSummariesForUser(userId: string) {
  const authenticatedUserId = requireUserId(userId);
  const rows =
    await portfolioRepository.listPortfolioSummariesForUser(
      authenticatedUserId,
    );

  const summaries = new Map<
    string,
    {
      id: string;
      name: string;
      role: string;
      assetCount: number;
      assetCounts: {
        stocks: number;
        crypto: number;
        cash: number;
        realEstate: number;
      };
      valuesByCurrency: {
        currency: string;
        value: string;
      }[];
    }
  >();

  for (const row of rows) {
    let summary = summaries.get(row.portfolio_id);

    if (!summary) {
      summary = {
        id: row.portfolio_id,
        name: row.portfolio_name,
        role: row.role,
        assetCount: row.asset_count,
        assetCounts: {
          stocks: row.stock_count,
          crypto: row.crypto_count,
          cash: row.cash_count,
          realEstate: row.real_estate_count,
        },
        valuesByCurrency: [],
      };

      summaries.set(row.portfolio_id, summary);
    }

    if (row.currency !== null && row.total_value !== null) {
      summary.valuesByCurrency.push({
        currency: row.currency,
        value: row.total_value,
      });
    }
  }

  return Array.from(summaries.values());
}
