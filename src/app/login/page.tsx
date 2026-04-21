"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  no_access: "Your account hasn't been set up yet. Contact your admin to request access.",
  auth_failed: "Authentication failed. Please try again.",
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("reset") === "success") setResetSuccess(true);
    const errKey = searchParams.get("error");
    if (errKey && ERROR_MESSAGES[errKey]) setError(ERROR_MESSAGES[errKey]);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase
        .from("user_profiles").select("role").eq("id", data.user.id).single();
      const isAdmin = profile?.role === "controller" || profile?.role === "employee";
      router.push(isAdmin ? "/admin/dashboard" : "/driver/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="text-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
            <span className="text-white font-bold font-syne text-base tracking-tight">FM</span>
          </div>
          <h1 className="text-2xl font-extrabold font-syne tracking-tight leading-none">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Fleet</span>
            <span className="text-foreground ml-1.5">Manager</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {resetSuccess && (
          <div className="p-3 rounded-xl text-sm" style={{ background: "var(--emerald-dim)", color: "var(--emerald)" }}>
            Password updated — you can now sign in.
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl border text-sm" style={{ background: "var(--rose-dim)", borderColor: "rgba(244,63,94,0.25)", color: "var(--rose)" }}>
            {error}
          </div>
        )}

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent bg-background text-sm transition-shadow duration-200"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent bg-background text-sm transition-shadow duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium text-sm cursor-pointer transition-opacity duration-200 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            style={{ background: "linear-gradient(135deg, var(--emerald) 0%, var(--teal) 100%)", color: "#fff" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href="/forgot-password"
            className="hover:text-foreground underline underline-offset-2 cursor-pointer transition-colors duration-200 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
