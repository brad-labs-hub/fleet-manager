import { createClient } from "@/lib/supabase/server";
import { InviteForm, UserList } from "./user-management";
import { Users, AlertTriangle } from "lucide-react";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("user_profiles")
    .select("id, email, name, role")
    .order("role")
    .order("email");

  const userList = users ?? [];
  const counts = {
    controller: userList.filter((u) => u.role === "controller").length,
    employee: userList.filter((u) => u.role === "employee").length,
    driver: userList.filter((u) => u.role === "driver").length,
  };

  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-syne text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Invite users and manage their access roles
          </p>
        </div>
        <InviteForm hasServiceKey={hasServiceKey} />
      </div>

      {/* Missing service key banner */}
      {!hasServiceKey && (
        <div className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ background: "var(--amber-dim)", borderColor: "rgba(249,115,22,0.3)" }}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
          <div>
            <p className="text-sm font-semibold text-foreground">Invite feature needs setup</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add <code className="bg-accent px-1.5 py-0.5 rounded font-mono text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> to your
              Vercel environment variables, then redeploy. Find it in{" "}
              <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2" style={{ color: "var(--amber)" }}>
                Supabase → Settings → API
              </a>{" "}
              under <strong>service_role</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Controllers", count: counts.controller, color: "var(--indigo-soft)", bg: "var(--indigo-dim)" },
          { label: "Employees", count: counts.employee, color: "var(--gold)", bg: "var(--gold-dim)" },
          { label: "Drivers", count: counts.driver, color: "var(--muted-foreground)", bg: "var(--surface2)" },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold font-syne" style={{ color }}>{count}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Microsoft SSO + MFA notice */}
      <div className="rounded-2xl border border-[rgba(99,102,241,0.25)] p-4 flex items-start gap-3"
        style={{ background: "var(--indigo-dim)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--indigo-dim)" }}>
          <Users className="h-4 w-4" style={{ color: "var(--indigo-soft)" }} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Microsoft SSO + mandatory authenticator app MFA</p>
          <p className="text-xs text-muted-foreground">
            All users must complete TOTP two-factor authentication on every login using an authenticator app (Microsoft Authenticator, Google Authenticator, or Authy). Microsoft SSO is also supported.
          </p>
          <p className="text-xs text-muted-foreground">
            To enable Microsoft SSO, configure the Azure provider in{" "}
            <a href="https://supabase.com/dashboard/project/_/auth/providers" target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2" style={{ color: "var(--indigo-soft)" }}>
              Supabase Auth → Providers
            </a>.
            TOTP MFA is enabled in{" "}
            <a href="https://supabase.com/dashboard/project/_/auth/mfa" target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2" style={{ color: "var(--indigo-soft)" }}>
              Supabase Auth → MFA
            </a>{" "}
            — ensure <strong>TOTP (App Authenticator)</strong> is set to <strong>Enabled</strong>.
          </p>
        </div>
      </div>

      {/* User list */}
      <UserList users={userList} currentUserId={currentUser?.id ?? ""} />
    </div>
  );
}
