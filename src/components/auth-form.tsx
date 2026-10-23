"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = isRegister
        ? await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: "/dashboard",
          })
        : await authClient.signIn.email({
            email,
            password,
            callbackURL: "/dashboard",
          });

      if (result.error) {
        setError(result.error.message || "Authentication failed. Please try again.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We could not reach the sign-in service. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f5f1] text-[#1d2923] lg:grid-cols-[minmax(280px,0.85fr)_1.15fr]">
      <aside className="relative flex min-h-52 flex-col justify-between overflow-hidden bg-[#173d31] px-7 py-7 text-[#f4f5f1] sm:px-10 sm:py-9 lg:min-h-screen lg:px-12 lg:py-12">
        <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 sm:size-96" />
        <div aria-hidden="true" className="absolute -right-8 -top-12 size-48 rounded-full border border-white/10 sm:size-64" />
        <Link href="/" className="relative z-10 w-fit text-sm font-semibold tracking-[0.16em]">
          WEALTH <span className="text-[#d4a96a]">/</span> TRACKER
        </Link>
        <div className="relative z-10 mt-10 max-w-sm lg:mb-10">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[#d4a96a]">
            Personal finance, thoughtfully
          </p>
          <h1 className="text-3xl font-medium leading-tight sm:text-4xl">
            A clearer view starts here.
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
            Sign in to continue, or create an account to get started.
          </p>
        </div>
        <p className="relative z-10 mt-8 hidden text-xs text-white/50 lg:block">
          Your account, your view.
        </p>
      </aside>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-medium text-[#587267]">
              {isRegister ? "Create your account" : "Welcome back"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {isRegister ? "Get started" : "Sign in"}
            </h2>
            <p className="mt-2 text-sm text-[#66736d]">
              {isRegister
                ? "Use your email address to create a secure account."
                : "Enter your details to access your account."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 w-full rounded-md border border-[#d6ddd7] bg-white px-3.5 text-sm outline-none transition focus:border-[#37715b] focus:ring-2 focus:ring-[#37715b]/15"
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-md border border-[#d6ddd7] bg-white px-3.5 text-sm outline-none transition focus:border-[#37715b] focus:ring-2 focus:ring-[#37715b]/15"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-md border border-[#d6ddd7] bg-white px-3.5 text-sm outline-none transition focus:border-[#37715b] focus:ring-2 focus:ring-[#37715b]/15"
              />
              {isRegister && <p className="text-xs text-[#66736d]">Use 8 to 128 characters.</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-[#e5b9ad] bg-[#fff4f0] px-3.5 py-3 text-sm text-[#873d2c]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-md bg-[#1d5744] px-4 text-sm font-semibold text-white transition hover:bg-[#164634] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5744] disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting
                ? isRegister ? "Creating account..." : "Signing in..."
                : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#66736d]">
            {isRegister ? "Already have an account? " : "New here? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-[#1d5744] underline decoration-[#a9c1b5] underline-offset-4 hover:text-[#123d2e]"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}