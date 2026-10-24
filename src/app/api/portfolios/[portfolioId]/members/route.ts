import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  addPortfolioMember,
  listPortfolioMembers,
} from "@/features/portfolios/portfolio.service";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ portfolioId: string }>;
};

function serviceErrorResponse(error: unknown) {
  if (error instanceof Error) {
    const status =
      error.message === "Portfolio not found" ? 404 :
      error.message === "Only portfolio owners can add members" ? 403 :
      error.message === "No registered user found with that email" ? 404 :
      error.message === "This user is already a portfolio member" ? 409 :
      500;

    if (status !== 500) {
      return NextResponse.json({ error: error.message }, { status });
    }
  }

  console.error("Portfolio member request failed:", error);
  return NextResponse.json(
    { error: "Unable to process portfolio member request" },
    { status: 500 },
  );
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { portfolioId } = await params;

  try {
    const members = await listPortfolioMembers(session.user.id, portfolioId);
    return NextResponse.json({ members });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    typeof body.email !== "string" ||
    !body.email.trim()
  ) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }

  const { portfolioId } = await params;

  try {
            const role =
                "role" in body &&
                (body.role === "EDITOR" || body.role === "VIEWER")
                    ? body.role
                    : "VIEWER";

        const member = await addPortfolioMember(
        session.user.id,
        portfolioId,
        body.email,
        role,
        );


    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}