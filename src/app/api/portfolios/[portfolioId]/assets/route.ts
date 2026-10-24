import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { AssetServiceError, createAsset, listAssets } from "@/features/assets/asset.service";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ portfolioId: string }>;
};

function serviceErrorResponse(error: unknown) {
  if (error instanceof AssetServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Asset request failed:", error);
  return NextResponse.json({ error: "Unable to process asset request" }, { status: 500 });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { portfolioId } = await params;
  try {
    const assets = await listAssets(session.user.id, portfolioId);
    return NextResponse.json({ assets });
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

  const { portfolioId } = await params;
  try {
    const asset = await createAsset(session.user.id, portfolioId, body);
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}