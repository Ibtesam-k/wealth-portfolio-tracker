import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  AssetServiceError,
  deleteAsset,
} from "@/features/assets/asset.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ portfolioId: string; assetId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { portfolioId, assetId } = await params;

  try {
    await deleteAsset(session.user.id, portfolioId, assetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AssetServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Failed to delete asset", error);

    return NextResponse.json(
      { error: "Unable to delete asset" },
      { status: 500 },
    );
  }
}