
"use client";

import { useEffect, useState } from "react";
import {
  PortfolioSummaryCard,
  type PortfolioSummary,
} from "./portfolio-summary-card";
import Link from "next/link";

type PortfolioListResponse = {
  portfolios?: PortfolioSummary[];
  error?: string;
};

export function PortfolioList() {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPortfolios() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/portfolio-summaries", {
          signal: controller.signal,
        });
        const result = (await response.json()) as PortfolioListResponse;

        if (!response.ok) {
          throw new Error(result.error || "Unable to load portfolios.");
        }

        setPortfolios(result.portfolios ?? []);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load portfolios. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadPortfolios();
    return () => controller.abort();
  }, [reloadKey]);

  return (
    <div className="mt-8 border-t border-[#e3e8e4] pt-6">
      <h2 className="text-lg font-semibold text-[#1d2923]">
        Portfolio overview
      </h2>

      {isLoading && (
        <p className="mt-4 text-sm text-[#66736d]" role="status">
          Loading portfolios...
        </p>
      )}

      {!isLoading && error && (
        <div className="mt-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-3 text-sm font-semibold text-[#1d5744] underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && portfolios.length === 0 && (
        <div className="mt-4 border border-dashed border-[#cbd6cf] px-5 py-7">
          <p className="text-sm text-[#66736d]">
            You haven&apos;t created a portfolio yet.
          </p>
          <Link
            href="/dashboard/portfolios/new"
            className="mt-4 inline-flex min-h-10 items-center justify-center border border-[#1d5744] px-4 text-sm font-semibold text-[#1d5744] transition-colors hover:bg-[#edf4f0]"
          >
            Create Portfolio
          </Link>
        </div>
      )}

      {!isLoading && !error && portfolios.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          {portfolios.map((portfolio) => (
            <PortfolioSummaryCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </ul>
      )}
    </div>
  );
}
