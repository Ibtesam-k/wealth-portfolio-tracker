import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";
import { PortfolioList } from "./portfolio-list";
import Link from "next/link";

export const instant = false;
export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f4f5f1] px-5 py-12 text-[#1d2923] sm:px-10">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 border-b border-[#d9e0db] pb-5">
        <p className="text-base font-semibold text-[#1d5744] sm:text-lg">
          Wealth Portfolio Tracker
        </p>
        <SignOutButton />
      </header>

      <section className="mx-auto mt-8 w-full max-w-3xl border-t-4 border-[#1d5744] bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#587267]">
              Wealth Tracker
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Your portfolios
            </h1>
            <p className="mt-2 text-sm text-[#66736d]">
              Welcome, {session.user.name}.
            </p>
          </div>
          <Link
            href="/dashboard/portfolios/new"
            className="inline-flex min-h-11 items-center justify-center bg-[#1d5744] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#164333]"
          >
            Create Portfolio
          </Link>
        </div>
        <PortfolioList />
      </section>
    </main>
  );
}