"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type CreatePortfolioResponse = {
  portfolio?: { name: string };
  error?: string;
};

export function PortfolioCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdName, setCreatedName] = useState("");

  useEffect(() => {
    if (!createdName) return;

    const timeout = window.setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [createdName, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setError("Name must be between 1 and 100 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = (await response.json()) as CreatePortfolioResponse;

      if (!response.ok) {
        setError(result.error || "Unable to create portfolio. Please try again.");
        return;
      }

      setCreatedName(result.portfolio?.name ?? trimmedName);
    } catch {
      setError("Unable to create portfolio. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 max-w-xl">
      <label htmlFor="portfolio-name" className="block text-sm font-semibold text-[#1d2923]">
        Portfolio name
      </label>
      <input
        id="portfolio-name"
        name="name"
        type="text"
        required
        maxLength={100}
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={isSubmitting || Boolean(createdName)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "portfolio-form-error" : undefined}
        className="mt-2 min-h-11 w-full border border-[#cbd6cf] bg-white px-3 text-base outline-none focus:border-[#1d5744] focus:ring-2 focus:ring-[#1d5744]/20 disabled:bg-[#f4f5f1]"
      />

      {error && (
        <p id="portfolio-form-error" role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {createdName && (
        <p role="status" className="mt-3 text-sm text-[#1d5744]">
          {createdName} was created. Returning to your portfolios...
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || Boolean(createdName)}
        className="mt-5 inline-flex min-h-11 items-center justify-center bg-[#1d5744] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#164333] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create Portfolio"}
      </button>
    </form>
  );
}