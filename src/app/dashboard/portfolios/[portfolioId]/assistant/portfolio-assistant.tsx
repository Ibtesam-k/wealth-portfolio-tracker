"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  portfolioId: string;
};

export default function PortfolioAssistant({ portfolioId }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    setLoading(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch(
        `/api/portfolios/${portfolioId}/assistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmedQuestion }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to answer your question. Please try again.",
        );
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5 rounded-xl border p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="question" className="block text-sm font-medium">
          Your question
        </label>

        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Summarize my portfolio assets and their recorded values..."
          maxLength={1000}
          rows={4}
          required
          disabled={loading}
          className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
        />

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            {question.length}/1000 characters
          </span>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask assistant"}
          </button>
        </div>
      </form>

      {loading && (
        <p role="status" className="text-sm text-gray-600">
          Waiting for the AI service. This may take a little while.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

    {answer && (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Answer</h2>

        <div className="prose prose-sm max-w-none text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-li:marker:text-gray-600">
        <div className="text-sm leading-7 text-gray-800">
  <ReactMarkdown
    components={{
      h3: ({ children }) => (
        <h3 className="mb-2 mt-5 text-base font-semibold text-gray-900">
          {children}
        </h3>
      ),
      ul: ({ children }) => (
        <ul className="mb-4 list-disc space-y-1 pl-6">
          {children}
        </ul>
      ),
      li: ({ children }) => (
        <li className="pl-1">{children}</li>
      ),
      p: ({ children }) => (
        <p className="mb-3">{children}</p>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-gray-900">
          {children}
        </strong>
      ),
      hr: () => <hr className="my-4 border-gray-200" />,
    }}
  >
    {answer}
  </ReactMarkdown>
</div>
        </div>
    </div>
    )}
    </section>
  );
}