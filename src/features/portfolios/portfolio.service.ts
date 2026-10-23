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