"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserPlus, X, Check, MoreHorizontal, KeyRound, Shield, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<string, string> = {
  driver: "Driver",
  employee: "Employee",
  controller: "Controller (Admin)",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  driver: "Can view assigned vehicles, log receipts and maintenance",
  employee: "Admin access — can manage vehicles, receipts, and reports",
  controller: "Full access including user management and all settings",
};

export function InviteForm({ hasServiceKey }: { hasServiceKey: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("driver");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send invite");
      setSuccess(`Invite sent to ${email}`);
      setEmail("");
      setName("");
      setRole("driver");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {success && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm" style={{ background: "var(--emerald-dim)", color: "var(--emerald)" }}>
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {!open ? (
        <button
          onClick={() => { if (hasServiceKey) { setOpen(true); setSuccess(null); } }}
          disabled={!hasServiceKey}
          title={!hasServiceKey ? "Add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables first" : undefined}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, var(--emerald) 0%, var(--teal) 100%)" }}
        >
          <UserPlus className="h-4 w-4" />
          Invite User
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-syne text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" style={{ color: "var(--emerald-soft)" }} />
              Send Invitation
            </h3>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role *</label>
              <div className="grid sm:grid-cols-3 gap-2">
                {Object.entries(ROLE_LABELS).map(([r, label]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`text-left p-3 rounded-xl border text-sm transition-all ${
                      role === r
                        ? "border-[rgba(16,185,129,0.4)] text-foreground"
                        : "border-border text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                    style={role === r ? { background: "var(--emerald-dim)" } : {}}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-[11px] mt-0.5 opacity-70">{ROLE_DESCRIPTIONS[r]}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm p-3 rounded-xl" style={{ background: "var(--rose-dim)", color: "var(--rose)" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, var(--emerald) 0%, var(--teal) 100%)" }}>
                <Mail className="h-3.5 w-3.5" />
                {loading ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

type UserRow = { id: string; email: string | null; name: string | null; role: string };

export function UserList({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [linkModal, setLinkModal] = useState<{ link: string; title: string } | null>(null);
  const router = useRouter();

  const ROLE_BADGE: Record<string, string> = {
    controller: "bg-[var(--emerald-dim)] text-[var(--emerald-soft)] border border-[rgba(16,185,129,0.25)]",
    employee:   "bg-[var(--gold-dim)] text-[var(--gold)] border border-[rgba(245,158,11,0.25)]",
    driver:     "bg-accent text-muted-foreground border border-border",
  };

  async function handleDelete(userId: string, email: string | null) {
    if (!confirm(`Remove ${email ?? "this user"}? They will lose access immediately.`)) return;
    setDeleting(userId);
    try {
      await fetch("/api/admin/invite-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingRole(userId);
    try {
      await fetch("/api/admin/invite-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      router.refresh();
    } finally {
      setUpdatingRole(null);
    }
  }

  async function handleReinvite(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/reinvite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (json.link) setLinkModal({ link: json.link, title: "Magic link (copy and send to user)" });
      else router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to re-invite");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetMfa(userId: string) {
    if (!confirm("Remove MFA for this user? They will need to set it up again on next login.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/reset-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset MFA");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetPassword(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (json.link) setLinkModal({ link: json.link, title: "Password reset link (copy and send to user)" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate reset link");
    } finally {
      setActionLoading(null);
    }
  }

  function copyLink() {
    if (linkModal) {
      navigator.clipboard.writeText(linkModal.link);
      setLinkModal(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border border-border bg-card">
        <UserPlus className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No users yet — send your first invite above.</p>
      </div>
    );
  }

  return (
    <>
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setLinkModal(null)}>
          <div
            className="rounded-2xl border border-border bg-card p-5 max-w-lg w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-foreground mb-2">{linkModal.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">Copy this link and send it to the user securely.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={linkModal.link}
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-xs font-mono truncate"
              />
              <Button size="sm" onClick={copyLink} className="shrink-0">
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setLinkModal(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-accent/40 transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-syne shrink-0"
                    style={{ background: "var(--emerald-dim)", color: "var(--emerald-soft)" }}>
                    {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{u.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{u.email}</td>
              <td className="px-5 py-3.5">
                {u.id === currentUserId ? (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_BADGE[u.role] ?? ROLE_BADGE.driver}`}>
                    {ROLE_LABELS[u.role] ?? u.role} (you)
                  </span>
                ) : (
                  <select
                    value={u.role}
                    disabled={updatingRole === u.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="text-xs rounded-lg px-2 py-1 border border-border bg-background text-foreground focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="driver">Driver</option>
                    <option value="employee">Employee</option>
                    <option value="controller">Controller</option>
                  </select>
                )}
              </td>
              <td className="px-5 py-3.5 text-right">
                {u.id !== currentUserId && (
                  <div className="flex items-center justify-end gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === u.id}
                        >
                          {actionLoading === u.id ? (
                            <span className="text-xs">…</span>
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[10rem]">
                        <DropdownMenuItem onClick={() => handleReinvite(u.id)}>
                          <Mail className="h-3.5 w-3.5 mr-2" />
                          Re-invite
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetMfa(u.id)}>
                          <Shield className="h-3.5 w-3.5 mr-2" />
                          Reset MFA
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(u.id)}>
                          <KeyRound className="h-3.5 w-3.5 mr-2" />
                          Reset password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      disabled={deleting === u.id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-all disabled:opacity-40"
                    >
                      {deleting === u.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
