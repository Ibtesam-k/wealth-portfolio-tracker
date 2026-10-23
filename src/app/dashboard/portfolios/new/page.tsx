import Link from "next/link";
import { PortfolioCreateForm } from "./portfolio-create-form";

export default function NewPortfolioPage() {
  return (
    <main className="min-h-screen bg-[#f4f5f1] px-5 py-12 text-[#1d2923] sm:px-10">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 border-b border-[#d9e0db] pb-5">
        <Link href="/dashboard" className="text-base font-semibold text-[#1d5744] sm:text-lg">
          Wealth Portfolio Tracker
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center justify-center border border-[#1d5744] px-4 text-sm font-semibold text-[#1d5744] transition-colors hover:bg-[#edf4f0]"
        >
          Cancel
        </Link>
      </header>

      <section className="mx-auto mt-8 w-full max-w-3xl border-t-4 border-[#1d5744] bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#587267]">
          New portfolio
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Create a portfolio
        </h1>
        <p className="mt-2 text-sm text-[#66736d]">
          Add a name to get started.
        </p>
        <PortfolioCreateForm />
      </section>
    </main>
  );
}