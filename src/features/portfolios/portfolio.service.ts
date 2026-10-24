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

export async function listPortfolioMembers(
  userId: string,
  portfolioId: string,
) {
  const authenticatedUserId = requireUserId(userId);

  const membership = await portfolioRepository.findMembership(
    portfolioId,
    authenticatedUserId,
  );

  if (!membership) {
    throw new Error("Portfolio not found");
  }

  return portfolioRepository.listMembers(portfolioId);
}

export async function addPortfolioMember(
  userId: string,
  portfolioId: string,
  email: string,
  role: "EDITOR" | "VIEWER" = "VIEWER",
) {
  const authenticatedUserId = requireUserId(userId);

  const membership = await portfolioRepository.findMembership(
    portfolioId,
    authenticatedUserId,
  );

  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only portfolio owners can add members");
  }

  if (role !== "EDITOR" && role !== "VIEWER") {
    throw new Error("Invalid member role");
  }

  const user = await portfolioRepository.findUserByEmail(email);

  if (!user) {
    throw new Error("No registered user found with that email");
  }

  const existingMembership = await portfolioRepository.findMembership(
    portfolioId,
    user.id,
  );

  if (existingMembership) {
    throw new Error("This user is already a portfolio member");
  }

  return portfolioRepository.addMember(
    portfolioId,
    user.id,
    role,
  );
}

export async function removePortfolioMember(
  userId: string,
  portfolioId: string,
  targetUserId: string,
) {
  const authenticatedUserId = requireUserId(userId);

  const membership = await portfolioRepository.findMembership(
    portfolioId,
    authenticatedUserId,
  );

  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only portfolio owners can remove members");
  }

  if (authenticatedUserId === targetUserId) {
    throw new Error("You cannot remove yourself from the portfolio");
  }

  const targetMembership = await portfolioRepository.findMembership(
    portfolioId,
    targetUserId,
  );

  if (!targetMembership) {
    throw new Error("Portfolio member not found");
  }

  if (targetMembership.role === "OWNER") {
    const members = await portfolioRepository.listMembers(portfolioId);
    const ownerCount = members.filter(
      (member) => member.role === "OWNER",
    ).length;

    if (ownerCount <= 1) {
      throw new Error("A portfolio must have at least one owner");
    }
  }

  await portfolioRepository.removeMember(portfolioId, targetUserId);

  return { success: true as const };
}