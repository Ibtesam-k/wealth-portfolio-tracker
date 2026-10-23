import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  createPortfolioForUser,
  listPortfoliosForUser,
} from "@/features/portfolios/portfolio.service";

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
    const portfolios = await listPortfoliosForUser(session.user.id);
    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error("Failed to list portfolios", error);

    return NextResponse.json(
      { error: "Unable to load portfolios" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const result = await createPortfolioForUser(session.user.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { portfolio: result.portfolio },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create portfolio", error);

    return NextResponse.json(
      { error: "Unable to create portfolio" },
      { status: 500 },
    );
  }
}