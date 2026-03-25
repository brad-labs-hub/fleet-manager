"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function initFromRecoveryLink() {
      try {
        const url = new URL(window.location.href);

        // Supabase recovery links commonly put tokens in the URL hash.
        // We also support query-string tokens as a fallback.
        const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
        const queryParams = url.searchParams;

        const accessToken =
          hashParams.get("access_token") ?? queryParams.get("access_token") ?? undefined;
        const refreshToken =
          hashParams.get("refresh_token") ?? queryParams.get("refresh_token") ?? undefined;
        const code = hashParams.get("code") ?? queryParams.get("code") ?? undefined;

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;
        setHasSession(!!session);
        if (!session && !error) {
          setError("Auth session missing. Please use a valid password reset link and try again.");
        }

        // Clean the URL so refresh links are not re-used/visible.
        // (best-effort; ignore errors)
        if (window.location.hash || window.location.search) {
          url.hash = "";
          url.search = "";
          window.history.replaceState({}, "", url.toString());
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setHasSession(false);
        // Keep this generic so the UI doesn't leak token details.
        setError(err instanceof Error ? err.message : "Invalid or expired reset link");
      } finally {
        if (cancelled) return;
        setAuthLoading(false);
      }
    }

    initFromRecoveryLink();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (authLoading) return;
    if (!hasSession) {
      setError("Auth session missing. Please use a valid password reset link and try again.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/login?reset=success");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          Set new password
        </h1>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg text-foreground placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg text-foreground placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || authLoading || !hasSession}
            className="w-full py-2 bg-primary text-primary-foreground text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
