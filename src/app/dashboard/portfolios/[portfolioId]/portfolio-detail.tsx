"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AssetCreateForm } from "./asset-create-form";

type PortfolioRole = "OWNER" | "EDITOR" | "VIEWER";

type Portfolio = {
  id: string;
  name: string;
  role: PortfolioRole | null;
};

type Asset = {
  id: string;
  name: string;
  type: "STOCK" | "CRYPTO" | "CASH" | "REAL_ESTATE";
  currency: string;
  symbol?: string;
  currentPrice?: string;
  cashBalance?: string;
  estimatedValue?: string;
  valuationEffectiveAt?: string;
  initialBuy?: {
  quantity: string | null;
  unitPrice: string | null;
  amount: string | null;
  occurredAt: string;
} | null;
};

type ApiResult<T> = {
  portfolios?: T[];
  assets?: T[];
  error?: string;
};

type AssetType = Asset["type"];

const assetSections: {
  type: AssetType;
  title: string;
  subtitle: string;
  emptyText: string;
}[] = [
  {
    type: "STOCK",
    title: "Stocks",
    subtitle: "Equity holdings and their recorded prices.",
    emptyText: "No stocks in this portfolio.",
  },
  {
    type: "CRYPTO",
    title: "Crypto",
    subtitle: "Digital asset holdings and their recorded prices.",
    emptyText: "No crypto assets in this portfolio.",
  },
  {
    type: "CASH",
    title: "Cash",
    subtitle: "Balances derived from recorded cash movements.",
    emptyText: "No cash accounts in this portfolio.",
  },
  {
    type: "REAL_ESTATE",
    title: "Real Estate",
    subtitle: "Property assets and their latest recorded valuations.",
    emptyText: "No real estate assets in this portfolio.",
  },
];

function formatDecimal(value: string, currency?: string) {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) return currency ? `${currency} ${value}` : value;

  const [, sign, whole, originalFraction = ""] = match;
  let fraction = originalFraction;

  if (currency === "USD") {
    const cents = fraction.padEnd(3, "0");
    let roundedCents = cents.slice(0, 2);
    if (cents[2] >= "5") {
      const nextDigit: Record<string, string> = {
        "0": "1", "1": "2", "2": "3", "3": "4", "4": "5",
        "5": "6", "6": "7", "7": "8", "8": "9",
      };
      const [tens, ones] = roundedCents;
      const incremented = ones === "9"
        ? (tens === "9" ? "100" : `${nextDigit[tens]}0`)
        : `${tens}${nextDigit[ones]}`;
      if (incremented === "100") {
        const incrementWhole = (digits: string): string => {
          const result = digits.split("");
          for (let index = result.length - 1; index >= 0; index -= 1) {
            if (result[index] !== "9") {
              result[index] = nextDigit[result[index]];
              return result.join("");
            }
            result[index] = "0";
          }
          return `1${result.join("")}`;
        };
        const roundedWhole = incrementWhole(whole);
        const groupedWhole = roundedWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `${currency} ${sign}${groupedWhole}.00`;
      }
      roundedCents = incremented;
    }
    fraction = roundedCents;
  }

  const grouped = `${sign}${whole}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const amount = fraction ? `${grouped}.${fraction}` : grouped;
  return currency ? `${currency} ${amount}` : amount;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function AssetCard({ asset }: { asset: Asset }) {
  const isTradable = asset.type === "STOCK" || asset.type === "CRYPTO";
  const mainValueLabel = isTradable
    ? asset.type === "STOCK"
      ? "Recorded price per share"
      : "Recorded price per unit"
    : asset.type === "CASH"
      ? "Current account balance"
      : "Latest estimated property value";
  const mainValue = isTradable
    ? formatDecimal(asset.currentPrice ?? "0", asset.currency)
    : asset.type === "CASH"
      ? formatDecimal(asset.cashBalance ?? "0", asset.currency)
      : asset.estimatedValue
        ? formatDecimal(asset.estimatedValue, asset.currency)
        : null;

  return (
    <li className="min-w-0 border border-[#dce4de] bg-[#fbfcfb] p-5 sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-[#1d2923]">{asset.name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase text-[#66736d]">
            {asset.type.replace("_", " ")} <span aria-hidden="true">·</span> {asset.currency}
          </p>
        </div>
        {isTradable && asset.symbol && (
          <span className="shrink-0 border border-[#dce4de] bg-white px-2 py-1 text-xs font-semibold text-[#34453c]">
            {asset.symbol}
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase text-[#66736d]">{mainValueLabel}</p>
        {mainValue ? (
          <p className="mt-1 break-all text-2xl font-semibold tabular-nums text-[#1d5744]">
            {mainValue}
          </p>
        ) : (
          <p className="mt-1 text-base font-medium text-[#66736d]">No valuation recorded</p>
        )}
        {(isTradable || asset.type === "REAL_ESTATE") && (
          <p className="mt-1 text-xs text-[#66736d]">
            {isTradable ? "Manually recorded; not live market data." : "Recorded estimate; not a live market price."}
          </p>
        )}
      </div>

      <dl className="mt-5 space-y-2 border-t border-[#e3e8e4] pt-4 text-sm">
        {isTradable && (
          <>
            {asset.initialBuy && (
              <>
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="text-[#66736d]">Initial purchase quantity</dt>
                  <dd className="text-right font-medium tabular-nums text-[#34453c]">
                    {asset.initialBuy.quantity ?? "Unavailable"}{asset.initialBuy.quantity ? (asset.type === "STOCK" ? " shares" : " units") : ""}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="text-[#66736d]">
                    Initial purchase price per {asset.type === "STOCK" ? "share" : "unit"}
                  </dt>
                  <dd className="text-right font-medium tabular-nums text-[#34453c]">
                    {asset.initialBuy.unitPrice
                      ? formatDecimal(asset.initialBuy.unitPrice, asset.currency)
                      : "Unavailable"}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="text-[#66736d]">Initial transaction amount</dt>
                  <dd className="text-right font-medium tabular-nums text-[#34453c]">
                    {asset.initialBuy.amount
                      ? formatDecimal(asset.initialBuy.amount, asset.currency)
                      : "Unavailable"}
                  </dd>
                </div>
              </>
            )}
          </>
        )}
        {asset.type === "REAL_ESTATE" && asset.valuationEffectiveAt && (
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
            <dt className="text-[#66736d]">Valuation effective date</dt>
            <dd className="text-right font-medium text-[#34453c]">
              {formatDate(asset.valuationEffectiveAt)}
            </dd>
          </div>
        )}
      </dl>
    </li>
  );
}

export function PortfolioDetail({ portfolioId }: { portfolioId: string }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadPortfolioData = useCallback(async (signal: AbortSignal) => {
    try {
      const [portfolioResponse, assetResponse] = await Promise.all([
        fetch("/api/portfolios", { signal }),
        fetch(`/api/portfolios/${encodeURIComponent(portfolioId)}/assets`, { signal }),
      ]);
      const [portfolioResult, assetResult] = await Promise.all([
        portfolioResponse.json() as Promise<ApiResult<Portfolio>>,
        assetResponse.json() as Promise<ApiResult<Asset>>,
      ]);

      if (portfolioResponse.status === 401 || assetResponse.status === 401) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      if (assetResponse.status === 403) {
        throw new Error("You do not have access to this portfolio.");
      }
      if (assetResponse.status === 404) {
        throw new Error("This portfolio could not be found.");
      }
      if (!portfolioResponse.ok || !assetResponse.ok) {
        throw new Error(assetResult.error || portfolioResult.error || "Unable to load this portfolio.");
      }

      const foundPortfolio = portfolioResult.portfolios?.find((item) => item.id === portfolioId);
      if (!foundPortfolio) {
        throw new Error("This portfolio could not be found.");
      }

      setPortfolio(foundPortfolio);
      setAssets(assetResult.assets ?? []);
    } catch (loadError) {
      if (signal.aborted) return;
      setError(loadError instanceof Error ? loadError.message : "Unable to load this portfolio.");
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadPortfolioData(controller.signal));
    return () => controller.abort();
  }, [loadPortfolioData, refreshKey]);

  const canCreate = portfolio?.role === "OWNER" || portfolio?.role === "EDITOR";

  return (
    <main className="min-h-screen bg-[#f4f5f1] px-5 py-8 text-[#1d2923] sm:px-10 sm:py-12">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 border-b border-[#d9e0db] pb-5">
        <Link href="/dashboard" className="text-base font-semibold text-[#1d5744] sm:text-lg">
          Wealth Portfolio Tracker
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center justify-center border border-[#1d5744] px-4 text-sm font-semibold text-[#1d5744] transition-colors hover:bg-[#edf4f0]"
        >
          All portfolios
        </Link>
      </header>

      <section className="mx-auto mt-8 w-full max-w-4xl border-t-4 border-[#1d5744] bg-white px-5 py-7 shadow-sm sm:px-9 sm:py-9">
        {isLoading && (
          <p role="status" className="py-8 text-sm text-[#66736d]">Loading portfolio...</p>
        )}

        {!isLoading && error && (
          <div role="alert" className="py-5">
            <h1 className="text-2xl font-semibold">Portfolio unavailable</h1>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                setIsLoading(true);
                setRefreshKey((key) => key + 1);
              }}
              className="mt-4 text-sm font-semibold text-[#1d5744] underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && portfolio && (
          <>
            <div className="flex flex-col justify-between gap-4 border-b border-[#e3e8e4] pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#587267]">
                  {portfolio.role?.toLowerCase() ?? "Portfolio"}
                </p>
                <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight">{portfolio.name}</h1>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold">Assets</h2>
              {assets.length === 0 && (
                <p className="mt-3 border border-dashed border-[#cbd6cf] px-4 py-6 text-sm text-[#66736d]">
                  No assets in this portfolio yet.
                </p>
              )}
              <div className="mt-5 space-y-8">
                {assetSections.map((section) => {
                  const sectionAssets = assets.filter((asset) => asset.type === section.type);

                  return (
                    <section key={section.type} aria-labelledby={`assets-${section.type}`}>
                      <div className="border-b border-[#e3e8e4] pb-3">
                        <h3 id={`assets-${section.type}`} className="text-base font-semibold text-[#1d2923]">
                          {section.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#66736d]">{section.subtitle}</p>
                      </div>
                      {sectionAssets.length > 0 ? (
                        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {sectionAssets.map((asset) => (
                            <AssetCard key={asset.id} asset={asset} />
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-[#66736d]">{section.emptyText}</p>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>

            {canCreate ? (
              <AssetCreateForm
                portfolioId={portfolioId}
                onCreated={() => {
                  setIsLoading(true);
                  setRefreshKey((key) => key + 1);
                }}
              />
            ) : (
              <p className="mt-7 border-t border-[#e3e8e4] pt-5 text-sm text-[#66736d]">
                You have view-only access to this portfolio.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}