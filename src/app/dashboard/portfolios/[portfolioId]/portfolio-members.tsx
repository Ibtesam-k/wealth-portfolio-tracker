
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type PortfolioRole = "OWNER" | "EDITOR" | "VIEWER";

type PortfolioMember = {
  userId: string;
  role: PortfolioRole;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type MembersResponse = {
  members?: PortfolioMember[];
  error?: string;
};

type MemberResponse = {
  member?: PortfolioMember;
  error?: string;
};

export function PortfolioMembers({
  portfolioId,
}: {
  portfolioId: string;
}) {
  const [members, setMembers] = useState<PortfolioMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/portfolios/${encodeURIComponent(portfolioId)}/members`,
      );
      const result = (await response.json()) as MembersResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to load members.");
      }

      setMembers(result.members ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load members.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/portfolios/${encodeURIComponent(portfolioId)}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), role }),
        },
      );

      const result = (await response.json()) as MemberResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to add member.");
      }

      setEmail("");
      setRole("VIEWER");
      setMessage("Member added successfully.");
      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add member.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveMember(member: PortfolioMember) {
    if (member.role === "OWNER") return;

    if (!window.confirm(`Remove ${member.user.name} from this portfolio?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/portfolios/${encodeURIComponent(portfolioId)}/members/${encodeURIComponent(member.user.id)}`,
        { method: "DELETE" },
      );

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Unable to remove member.");
      }

      setMessage("Member removed successfully.");
      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove member.",
      );
    }
  }

  return (
    <section className="mt-7">
      <h2 className="text-lg font-semibold">Members</h2>
      <p className="mt-1 text-sm text-[#66736d]">
        Manage who can access this portfolio.
      </p>

      <form
        onSubmit={handleAddMember}
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <label className="text-xs text-[#66736d]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            placeholder="person@example.com"
            className="mt-1 min-h-10 w-full border border-[#cbd6cf] px-3 text-sm text-[#1d2923]"
          />
        </label>

        <label className="text-xs text-[#66736d]">
          Role
          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "EDITOR" | "VIEWER")
            }
            disabled={isSubmitting}
            className="mt-1 min-h-10 w-full border border-[#cbd6cf] bg-white px-3 text-sm text-[#1d2923]"
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 min-h-10 bg-[#1d5744] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:self-end"
        >
          {isSubmitting ? "Adding..." : "Add member"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-[#1d5744]">
          {message}
        </p>
      )}

      <div className="mt-5">
        {isLoading ? (
          <p role="status" className="text-sm text-[#66736d]">
            Loading members...
          </p>
        ) : members.length === 0 ? (
          <p className="text-sm text-[#66736d]">No members found.</p>
        ) : (
          <ul className="divide-y divide-[#e3e8e4] border-y border-[#e3e8e4]">
            {members.map((member) => (
              <li
                key={member.user.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">
                    {member.user.name}
                  </p>
                  <p className="break-all text-sm text-[#66736d]">
                    {member.user.email}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase text-[#587267]">
                    {member.role}
                  </p>
                </div>

                {member.role !== "OWNER" && (
                  <button
                    type="button"
                    onClick={() => void handleRemoveMember(member)}
                    className="text-xs font-semibold text-red-700 underline underline-offset-4"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
