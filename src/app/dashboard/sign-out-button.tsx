"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setIsSigningOut(true);
    setError("");

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message || "Could not sign out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="inline-flex min-h-10 items-center justify-center border border-[#1d5744] px-4 text-sm font-semibold text-[#1d5744] transition-colors hover:bg-[#edf4f0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}