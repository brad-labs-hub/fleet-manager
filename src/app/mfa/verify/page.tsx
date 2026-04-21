"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, LogOut } from "lucide-react";

type Status = "loading" | "ready" | "verifying" | "error";

export default function MFAVerifyPage() {
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";
  const supabase = createClient();

  const prepare = useCallback(async () => {
    setError(null);
    setStatus("loading");
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const verified = (factors?.totp ?? []).find((f: any) => f.status === "verified");
      if (!verified) {
        router.replace(`/mfa/setup?next=${encodeURIComponent(next)}`);
        return;
      }
      setFactorId(verified.id);
      const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: verified.id });
      if (chalErr) throw chalErr;
      setChallengeId(chal.id);
      setStatus("ready");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not start verification");
      setStatus("error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  useEffect(() => { prepare(); }, [prepare]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("verifying");
    try {
      let cid = challengeId;
      if (!cid) {
        const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId });
        if (chalErr) throw chalErr;
        cid = chal.id;
        setChallengeId(cid);
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: cid, code });
      if (verifyErr) throw verifyErr;
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code — please try again");
      setStatus("ready");
      setCode("");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-emerald">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-syne text-foreground">Verification required</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Open your authenticator app and enter the 6-digit code for Fleet Manager.
          </p>
        </div>

        {status === "loading" && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
              style={{ borderColor: "var(--emerald)", borderTopColor: "transparent" }} />
          </div>
        )}

        {(status === "ready" || status === "verifying" || status === "error") && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                required
                disabled={status === "verifying"}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-center text-2xl font-bold font-syne tracking-[0.5em] focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground/30 placeholder:tracking-normal disabled:opacity-50"
              />

              {error && (
                <p className="text-sm p-3 rounded-xl" style={{ background: "var(--rose-dim)", color: "var(--rose)" }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={status === "verifying" || code.length < 6}
                className="w-full py-2.5 rounded-xl font-medium text-sm text-white disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, var(--emerald) 0%, var(--teal) 100%)" }}>
                {status === "verifying" ? "Verifying…" : "Verify"}
              </button>
            </form>

            <div className="h-px bg-border" />

            <button onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <LogOut className="h-3.5 w-3.5" />
              Sign out and use a different account
            </button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Using <strong>Microsoft Authenticator</strong>, Google Authenticator, or Authy
        </p>
      </div>
    </main>
  );
}
