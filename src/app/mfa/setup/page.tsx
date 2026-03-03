"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Copy, Check, AlertTriangle, Smartphone } from "lucide-react";

type Status = "enrolling" | "scanning" | "verifying" | "failed";

export default function MFASetupPage() {
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("enrolling");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";
  const supabase = createClient();

  const enroll = useCallback(async () => {
    setError(null);
    setStatus("enrolling");
    try {
      // If already enrolled + verified, go straight to verify
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = (factors?.totp ?? []).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => f.status === "verified"
      );
      if (verified) {
        router.replace(`/mfa/verify?next=${encodeURIComponent(next)}`);
        return;
      }

      // Enroll TOTP factor
      const { data: enrollData, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Fleet Manager",
        friendlyName: "Fleet Manager",
      });
      if (enrollErr) throw enrollErr;

      const fid = enrollData.id;
      const totp = enrollData.totp;

      setFactorId(fid);
      setQrCode(totp.qr_code);
      setSecret(totp.secret);

      // Create a challenge so it's ready when the user submits
      const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: fid });
      if (chalErr) throw chalErr;
      setChallengeId(chal.id);

      setStatus("scanning");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to set up MFA");
      setStatus("failed");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  useEffect(() => { enroll(); }, [enroll]);

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("verifying");
    try {
      // Refresh challenge if needed
      let cid = challengeId;
      if (!cid) {
        const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId });
        if (chalErr) throw chalErr;
        cid = chal.id;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: cid, code });
      if (verifyErr) throw verifyErr;
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code — make sure your phone clock is synced");
      setStatus("scanning");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-indigo">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-syne text-foreground">Set up two-factor authentication</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Scan the QR code with your authenticator app to get started.
          </p>
        </div>

        {status === "enrolling" && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
              style={{ borderColor: "var(--indigo)", borderTopColor: "transparent" }} />
            <p className="text-sm text-muted-foreground">Preparing your 2FA setup…</p>
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-2xl border p-5 space-y-4"
            style={{ background: "var(--rose-dim)", borderColor: "rgba(244,63,94,0.3)" }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--rose)" }} />
              <p className="text-sm text-foreground">{error ?? "Setup failed — please try again."}</p>
            </div>
            <button onClick={enroll}
              className="w-full py-2 rounded-xl text-sm font-medium border border-border bg-card hover:bg-accent text-foreground transition-colors">
              Try again
            </button>
          </div>
        )}

        {(status === "scanning" || status === "verifying") && (
          <div className="space-y-4">
            {/* App recommendation */}
            <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
              <Smartphone className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--indigo-soft)" }} />
              <div className="text-sm">
                <p className="font-medium text-foreground">Use an authenticator app</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Works with <strong>Microsoft Authenticator</strong>, Google Authenticator, or Authy.
                  Install one on your phone if you haven&apos;t already.
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
              {/* Step 1: QR */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Step 1 — Scan QR code
                </p>
                <div className="flex justify-center">
                  {qrCode ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrCode}
                      alt="MFA QR Code"
                      className="w-44 h-44 rounded-xl border border-border bg-white p-2"
                    />
                  ) : (
                    <div className="w-44 h-44 rounded-xl border border-border bg-accent animate-pulse" />
                  )}
                </div>
                {/* Manual secret */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground text-center mb-2">Can&apos;t scan? Enter this key manually:</p>
                  <div className="flex items-center gap-2 bg-accent rounded-xl px-3 py-2">
                    <code className="flex-1 text-xs font-mono text-foreground break-all text-center tracking-widest select-all">
                      {secret}
                    </code>
                    <button onClick={copySecret} className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Step 2: Enter code */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Step 2 — Enter the 6-digit code from the app
                </p>
                <form onSubmit={handleVerify} className="space-y-3">
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

                  {error && (
                    <p className="text-sm p-3 rounded-xl" style={{ background: "var(--rose-dim)", color: "var(--rose)" }}>
                      {error}
                    </p>
                  )}

                  <button type="submit" disabled={status === "verifying" || code.length < 6}
                    className="w-full py-2.5 rounded-xl font-medium text-sm text-white disabled:opacity-50 transition-all"
                    style={{ background: "linear-gradient(135deg, var(--indigo) 0%, var(--violet) 100%)" }}>
                    {status === "verifying" ? "Verifying…" : "Activate 2FA"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
