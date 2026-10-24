import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { removePortfolioMember } from "@/features/portfolios/portfolio.service";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ portfolioId: string; userId: string }>;
};

function serviceErrorResponse(error: unknown) {
  if (error instanceof Error) {
    const statusByMessage: Record<string, number> = {
      "Portfolio not found": 404,
      "Only portfolio owners can remove members": 403,
      "You cannot remove yourself from the portfolio": 400,
      "Portfolio member not found": 404,
      "A portfolio must have at least one owner": 409,
    };

    const status = statusByMessage[error.message];

    if (status) {
      return NextResponse.json({ error: error.message }, { status });
    }
  }

  console.error("Portfolio member removal failed:", error);
  return NextResponse.json(
    { error: "Unable to remove portfolio member" },
    { status: 500 },
  );
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { portfolioId, userId } = await params;

  try {
    const result = await removePortfolioMember(
      session.user.id,
      portfolioId,
      userId,
    );

    return NextResponse.json(result);
  } catch (error) {
    return serviceErrorResponse(error);
  }
}