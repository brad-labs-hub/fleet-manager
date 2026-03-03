"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ShieldCheck, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";

type Status = "enrolling" | "ready" | "verifying" | "resending" | "failed";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isSupabaseNotEnabledError(msg: string) {
  return (
    msg.toLowerCase().includes("not enabled") ||
    msg.toLowerCase().includes("factor_id") ||
    msg.toLowerCase().includes("unsupported") ||
    msg.toLowerCase().includes("uuid")
  );
}

export default function MFASetupPage() {
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("enrolling");
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";
  const supabase = createClient();

  function startCountdown() {
    setCountdown(60);
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }

  const enroll = useCallback(async () => {
    setError(null);
    setStatus("enrolling");
    try {
      // If already enrolled + verified, go straight to verify
      const { data: factors } = await supabase.auth.mfa.listFactors();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const verified = (factors?.all ?? []).find((f: any) => f.factor_type === "email" && f.status === "verified");
      if (verified) {
        router.replace(`/mfa/verify?next=${encodeURIComponent(next)}`);
        return;
      }

      // Enroll email factor
      const { data: enrollData, error: enrollErr } = await supabase.auth.mfa.enroll(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { factorType: "email" } as any
      );
      if (enrollErr) throw enrollErr;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fid: string = (enrollData as any)?.id ?? "";
      if (!fid || !UUID_RE.test(fid)) {
        throw new Error(
          "EMAIL_MFA_NOT_ENABLED: Email OTP MFA is not enabled in your Supabase project."
        );
      }

      setFactorId(fid);

      // Challenge → sends OTP to user's email
      const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: fid });
      if (chalErr) throw chalErr;

      setChallengeId(chal.id);
      setStatus("ready");
      startCountdown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set up MFA";
      setError(msg);
      setStatus("failed");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  useEffect(() => { enroll(); }, [enroll]);

  async function resend() {
    if (countdown > 0 || !factorId) return;
    setStatus("resending");
    setError(null);
    try {
      const { data, error: chalErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chalErr) throw chalErr;
      setChallengeId(data.id);
      setCode("");
      startCountdown();
      setStatus("ready");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
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

  const isSetupError = error && isSupabaseNotEnabledError(error);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-indigo">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-syne text-foreground">Set up email verification</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Fleet Manager requires two-factor authentication.<br />
            We&apos;ll send a 6-digit code to your email each time you sign in.
          </p>
        </div>

        {/* Enrolling spinner */}
        {status === "enrolling" && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
              style={{ borderColor: "var(--indigo)", borderTopColor: "transparent" }} />
            <p className="text-sm text-muted-foreground">Setting up email MFA…</p>
          </div>
        )}

        {/* Setup error — MFA not enabled in Supabase */}
        {status === "failed" && isSetupError && (
          <div className="rounded-2xl border p-5 space-y-4"
            style={{ background: "var(--amber-dim)", borderColor: "rgba(249,115,22,0.3)" }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
              <div>
                <p className="text-sm font-semibold text-foreground">Email MFA not enabled</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Email OTP must be enabled in your Supabase project before users can enroll.
                </p>
              </div>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1.5 ml-2 list-decimal list-inside">
              <li>Open your <a href="https://supabase.com/dashboard/project/_/auth/mfa" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 inline-flex items-center gap-0.5" style={{ color: "var(--amber)" }}>
                Supabase Auth → MFA settings <ExternalLink className="h-3 w-3" />
              </a></li>
              <li>Enable the <strong className="text-foreground">Email OTP</strong> factor</li>
              <li>Return here and click Retry</li>
            </ol>
            <button onClick={enroll}
              className="w-full py-2 rounded-xl text-sm font-medium border border-border bg-card hover:bg-accent text-foreground transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Generic error (not a setup error) */}
        {status === "failed" && !isSetupError && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <p className="text-sm p-3 rounded-xl" style={{ background: "var(--rose-dim)", color: "var(--rose)" }}>
              {error}
            </p>
            <button onClick={enroll}
              className="w-full py-2 rounded-xl text-sm font-medium border border-border hover:bg-accent text-foreground transition-colors">
              Try again
            </button>
          </div>
        )}

        {/* OTP form — only shown when enrollment succeeded */}
        {(status === "ready" || status === "verifying" || status === "resending") && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--indigo-dim)" }}>
              <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--indigo-soft)" }} />
              <p className="text-sm" style={{ color: "var(--indigo-soft)" }}>
                A 6-digit code was sent to your email. Enter it below to enable MFA.
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

              <button type="submit" disabled={status === "verifying" || code.length < 6}
                className="w-full py-2.5 rounded-xl font-medium text-sm text-white disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, var(--indigo) 0%, var(--violet) 100%)" }}>
                {status === "verifying" ? "Verifying…" : "Verify & Enable MFA"}
              </button>
            </form>

            <button type="button" onClick={resend}
              disabled={countdown > 0 || status === "resending"}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              {status === "resending" ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
