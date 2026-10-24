
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getPortfolioSummariesForUser } from "@/features/portfolios/portfolio.service";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const portfolios = await getPortfolioSummariesForUser(
      session.user.id,
    );

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error("Failed to load portfolio summaries", error);

    return NextResponse.json(
      { error: "Unable to load portfolio summaries" },
      { status: 500 },
    );
  }
}
