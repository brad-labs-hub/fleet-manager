"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, RefreshCw, Mail } from "lucide-react";

export default function MFAVerifyPage() {
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "verifying" | "resending">("loading");
  const [countdown, setCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";
  const supabase = createClient();

  function startCountdown() {
    setCountdown(60);
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }

  const initChallenge = useCallback(async () => {
    setError(null);
    try {
      // Get current user's email for display
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      // Check if already at AAL2 (e.g. refreshed the page after verifying)
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        router.replace(next);
        return;
      }

      // Get enrolled email factor
      const { data: factors } = await supabase.auth.mfa.listFactors();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emailFactor = (factors?.all ?? []).find((f: any) => f.factor_type === "email" && f.status === "verified");

      if (!emailFactor?.id) {
        // Not enrolled yet → go to setup
        router.replace(`/mfa/setup?next=${encodeURIComponent(next)}`);
        return;
      }

      const fid: string = emailFactor.id;
      setFactorId(fid);

      // Create challenge → sends OTP email
      const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: fid });
      if (chalErr) throw chalErr;

      setChallengeId(chal.id);
      setStatus("ready");
      startCountdown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
      setStatus("ready");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  useEffect(() => { initChallenge(); }, [initChallenge]);

  async function resend() {
    if (countdown > 0) return;
    setStatus("resending");
    setError(null);
    try {
      const { data, error: chalErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chalErr) throw chalErr;
      setChallengeId(data.id);
      setCode("");
      startCountdown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setStatus("ready");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("verifying");
    try {
      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
      if (verifyErr) throw verifyErr;
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code — please try again");
      setStatus("ready");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-indigo">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-syne text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground mt-2">
            A 6-digit verification code was sent to
            {userEmail && <span className="block font-medium text-foreground mt-0.5">{userEmail}</span>}
          </p>
        </div>

        {status === "loading" && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--indigo)", borderTopColor: "transparent" }} />
            <p className="text-sm text-muted-foreground">Sending code to your email…</p>
          </div>
        )}

        {(status === "ready" || status === "verifying" || status === "resending") && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--indigo-dim)" }}>
              <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--indigo-soft)" }} />
              <p className="text-sm" style={{ color: "var(--indigo-soft)" }}>
                Enter the 6-digit code from the email. Codes expire after 10 minutes.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Verification Code</label>
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
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-center text-2xl font-bold font-syne tracking-[0.5em] focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground/30 placeholder:tracking-normal"
                />
              </div>

              {error && (
                <p className="text-sm p-3 rounded-xl" style={{ background: "var(--rose-dim)", color: "var(--rose)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "verifying" || code.length < 6}
                className="w-full py-2.5 rounded-xl font-medium text-sm text-white disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, var(--indigo) 0%, var(--violet) 100%)" }}
              >
                {status === "verifying" ? "Verifying…" : "Verify"}
              </button>
            </form>

            <button
              type="button"
              onClick={resend}
              disabled={countdown > 0 || status === "resending"}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {status === "resending" ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>

            <div className="border-t border-border pt-4 text-center">
              <button onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Not you? Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
