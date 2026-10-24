import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { AssetServiceError, createLedgerEntry } from "@/features/assets/asset.service";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ portfolioId: string; assetId: string }>;
};

function serviceErrorResponse(error: unknown) {
  if (error instanceof AssetServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Transaction request failed:", error);
  return NextResponse.json({ error: "Unable to process transaction request" }, { status: 500 });
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

  const { portfolioId, assetId } = await params;
  try {
    const transaction = await createLedgerEntry(
      session.user.id,
      portfolioId,
      assetId,
      body,
    );
    return NextResponse.json({ transaction: {
      ...transaction,
      quantity: transaction.quantity?.toString() ?? null,
      unitPrice: transaction.unitPrice?.toString() ?? null,
      amount: transaction.amount?.toString() ?? null,
    } }, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}