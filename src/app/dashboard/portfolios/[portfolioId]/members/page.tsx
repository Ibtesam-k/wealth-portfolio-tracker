import Link from "next/link";
import { PortfolioMembers } from "../portfolio-members";

export const instant = false;
export default async function PortfolioMembersPage({
  params,
}: {
  params: Promise<{ portfolioId: string }>;
}) {
  const { portfolioId } = await params;

  return (
    <main className="min-h-screen bg-[#f4f5f1] px-5 py-8 text-[#1d2923] sm:px-10 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href={`/dashboard/portfolios/${portfolioId}`}
          className="text-sm font-semibold text-[#1d5744] underline underline-offset-4"
        >
          ← Back to portfolio
        </Link>

        <section className="mt-6 border-t-4 border-[#1d5744] bg-white px-5 py-7 shadow-sm sm:px-9 sm:py-9">
          <h1 className="text-2xl font-semibold tracking-tight">
            Portfolio members
          </h1>
          <p className="mt-2 text-sm text-[#66736d]">
            Manage who can access this portfolio and what they can do.
          </p>

          <PortfolioMembers portfolioId={portfolioId} />
        </section>
      </div>
    </main>
  );
}