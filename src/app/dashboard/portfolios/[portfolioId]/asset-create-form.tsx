"use client";

import { useState, type FormEvent } from "react";

type AssetType = "STOCK" | "CRYPTO" | "CASH" | "REAL_ESTATE";

type CreateAssetResponse = {
  error?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AssetCreateForm({
  portfolioId,
  onCreated,
}: {
  portfolioId: string;
  onCreated: () => void;
}) {
  const [type, setType] = useState<AssetType>("STOCK");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [symbol, setSymbol] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [openingBalance, setOpeningBalance] = useState("");
  const [cashDate, setCashDate] = useState(today);
  const [estimatedValue, setEstimatedValue] = useState("");
  const [valuationDate, setValuationDate] = useState(today);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setSuccess("");

    const payload: Record<string, unknown> = { name: name.trim(), type, currency: currency.trim() };
    if (type === "STOCK" || type === "CRYPTO") {
      payload.symbol = symbol.trim();
      payload.currentPrice = currentPrice.trim();
      payload.initialBuy = {
        quantity: quantity.trim(),
        unitPrice: unitPrice.trim(),
        occurredAt: new Date(`${purchaseDate}T12:00:00.000Z`).toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
    } else if (type === "CASH") {
      payload.openingBalance = {
        amount: openingBalance.trim(),
        occurredAt: new Date(`${cashDate}T12:00:00.000Z`).toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
    } else {
      payload.initialValuation = {
        estimatedValue: estimatedValue.trim(),
        effectiveAt: new Date(`${valuationDate}T12:00:00.000Z`).toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/portfolios/${encodeURIComponent(portfolioId)}/assets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as CreateAssetResponse;

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired. Please sign in again.");
        } else if (response.status === 403) {
          setError("You do not have permission to add assets to this portfolio.");
        } else if (response.status === 404) {
          setError("This portfolio could not be found.");
        } else {
          setError(result.error || "Unable to create asset. Please check the fields and try again.");
        }
        return;
      }

      setSuccess("Asset created successfully.");
      setName("");
      setSymbol("");
      setCurrentPrice("");
      setQuantity("");
      setUnitPrice("");
      setOpeningBalance("");
      setEstimatedValue("");
      setNote("");
      onCreated();
    } catch {
      setError("Unable to create asset. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = "mt-1 min-h-10 w-full border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1d5744] focus:ring-2 focus:ring-[#1d5744]/20 disabled:bg-[#f4f5f1]";
  const labelClass = "block text-sm font-medium text-[#34453c]";

  return (
    <form onSubmit={handleSubmit} className="mt-8 border-t border-[#e3e8e4] pt-6">
      <h2 className="text-lg font-semibold">Add an asset</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Asset type
          <select className={inputClass} value={type} onChange={(event) => setType(event.target.value as AssetType)} disabled={isSubmitting}>
            <option value="STOCK">Stock</option>
            <option value="CRYPTO">Crypto</option>
            <option value="CASH">Cash</option>
            <option value="REAL_ESTATE">Real estate</option>
          </select>
        </label>
        <label className={labelClass}>
          Name
          <input className={inputClass} required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
        </label>
        <label className={labelClass}>
          Currency
          <input className={inputClass} required minLength={3} maxLength={3} pattern="[A-Z]{3}" title="Use a 3-letter uppercase currency code, such as USD" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} disabled={isSubmitting} />
        </label>

        {(type === "STOCK" || type === "CRYPTO") && (
          <>
            <label className={labelClass}>
              Symbol
              <input className={inputClass} required maxLength={32} value={symbol} onChange={(event) => setSymbol(event.target.value)} disabled={isSubmitting} />
            </label>
            <label className={labelClass}>
              Current recorded price
              <input className={inputClass} required inputMode="decimal" value={currentPrice} onChange={(event) => setCurrentPrice(event.target.value)} disabled={isSubmitting} />
            </label>
            <label className={labelClass}>
              Initial BUY quantity
              <input className={inputClass} required inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={isSubmitting} />
            </label>
            <label className={labelClass}>
              Purchase unit price
              <input className={inputClass} required inputMode="decimal" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} disabled={isSubmitting} />
            </label>
            <label className={labelClass}>
              Purchase date
              <input className={inputClass} required type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} disabled={isSubmitting} />
            </label>
          </>
        )}

        {type === "CASH" && (
          <>
            <label className={labelClass}>
              Opening balance
              <input className={inputClass} required inputMode="decimal" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} disabled={isSubmitting} />
            </label>
            <label className={labelClass}>
              Opening balance date
              <input className={inputClass} required type="date" value={cashDate} onChange={(event) => setCashDate(event.target.value)} disabled={isSubmitting} />
            </label>
          </>
        )}

        {type === "REAL_ESTATE" && (
          <>
            <label className={labelClass}>
              Initial estimated value
              <input className={inputClass} required inputMode="decimal" value={estimatedValue} onChange={(event) => setEstimatedValue(event.target.value)} disabled={isSubmitting} />
            </label>
            <label className={labelClass}>
              Valuation date
              <input className={inputClass} required type="date" value={valuationDate} onChange={(event) => setValuationDate(event.target.value)} disabled={isSubmitting} />
            </label>
          </>
        )}
      </div>

      <label className={`${labelClass} mt-4 block`}>
        Note <span className="font-normal text-[#66736d]">(optional)</span>
        <textarea className={`${inputClass} min-h-20 py-2`} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} disabled={isSubmitting} />
      </label>

      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mt-4 text-sm text-[#1d5744]">{success}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex min-h-11 items-center justify-center bg-[#1d5744] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#164333] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating asset..." : "Create asset"}
      </button>
    </form>
  );
}