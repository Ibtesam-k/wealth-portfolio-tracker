import Link from "next/link";
import PortfolioAssistant from "./portfolio-assistant";

export const instant = false;

type PageProps = {
  params: Promise<{ portfolioId: string }>;
};

export default async function PortfolioAssistantPage({ params }: PageProps) {
  const { portfolioId } = await params;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href={`/dashboard/portfolios/${portfolioId}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to portfolio
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Portfolio assistant</h1>
        <p className="mt-2 text-sm text-gray-600">
          Ask questions about your recorded portfolio data. The assistant
          does not have live market prices or provide financial advice.
        </p>
      </div>

      <PortfolioAssistant portfolioId={portfolioId} />
    </main>
  );
}