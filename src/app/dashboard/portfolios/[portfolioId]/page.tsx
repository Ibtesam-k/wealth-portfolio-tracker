import { Suspense } from "react";
import { PortfolioDetail } from "./portfolio-detail";

type PortfolioDetailPageProps = {
  params: Promise<{ portfolioId: string }>;
};

export default async function PortfolioDetailPage({ params }: PortfolioDetailPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f4f5f1] px-5 py-12 text-[#1d2923] sm:px-10">
          <p role="status" className="mx-auto w-full max-w-4xl text-sm text-[#66736d]">
            Loading portfolio...
          </p>
        </main>
      }
    >
      <PortfolioDetailLoader params={params} />
    </Suspense>
  );
}

async function PortfolioDetailLoader({ params }: PortfolioDetailPageProps) {
  const { portfolioId } = await params;
  return <PortfolioDetail portfolioId={portfolioId} />;
}