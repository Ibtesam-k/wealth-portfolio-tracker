
import Link from "next/link";

export type PortfolioSummary = {
  id: string;
  name: string;
  role: string;
  assetCount: number;
  assetCounts: {
    stocks: number;
    crypto: number;
    cash: number;
    realEstate: number;
  };
  valuesByCurrency: {
    currency: string;
    value: string;
  }[];
};

type Props = {
  portfolio: PortfolioSummary;
};

export function PortfolioSummaryCard({ portfolio }: Props) {
  const assetTypes = [
    { label: "Stocks", count: portfolio.assetCounts.stocks },
    { label: "Crypto", count: portfolio.assetCounts.crypto },
    { label: "Cash", count: portfolio.assetCounts.cash },
    { label: "Real estate", count: portfolio.assetCounts.realEstate },
  ];

  return (
    <li className="min-w-0 border border-[#e3e8e4] bg-white p-5 transition-colors hover:border-[#b8c9bf]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-[#1d2923]">
            {portfolio.name}
          </h3>
          <p className="mt-1 text-sm capitalize text-[#66736d]">
            {portfolio.role.toLowerCase()}
          </p>
        </div>
        <span className="shrink-0 text-sm text-[#66736d]">
          {portfolio.assetCount}{" "}
          {portfolio.assetCount === 1 ? "asset" : "assets"}
        </span>
      </div>

      <div className="mt-5 border-t border-[#e3e8e4] pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#587267]">
          Estimated value
        </h4>

        {portfolio.valuesByCurrency.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {portfolio.valuesByCurrency.map(({ currency, value }) => (
              <li
                key={currency}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-[#66736d]">{currency}</span>
                <span className="font-semibold tabular-nums text-[#1d2923]">
                  {Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#66736d]">
            No assets recorded yet.
          </p>
        )}
        <p className="mt-2 text-xs text-[#66736d]">
          Manually recorded values; not live market data.
        </p>
      </div>

      <div className="mt-5 border-t border-[#e3e8e4] pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#587267]">
          Asset breakdown
        </h4>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {assetTypes.map(({ label, count }) => (
            <li key={label}>
              <p className="text-sm text-[#66736d]">{label}</p>
              <p className="mt-1 font-semibold tabular-nums text-[#1d2923]">
                {count}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={`/dashboard/portfolios/${encodeURIComponent(portfolio.id)}`}
        className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-[#1d5744] underline underline-offset-4 hover:text-[#164333]"
      >
        View portfolio
      </Link>
    </li>
  );
}
