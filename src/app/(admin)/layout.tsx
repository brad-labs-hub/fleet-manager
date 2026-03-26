export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "driver";
  const isAdmin = role === "controller" || role === "employee";
  if (!isAdmin) redirect("/driver/dashboard");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border px-4 py-2.5 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 cursor-pointer rounded-xl outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-indigo-sm shrink-0">
                <span className="text-white text-xs font-bold font-syne tracking-wide">FM</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold font-syne text-foreground leading-none">Fleet Manager</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">Admin</div>
              </div>
            </Link>
            <div className="h-5 w-px bg-border mx-1" />
            <Link
              href="/driver/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1 cursor-pointer transition-colors duration-200 hover:border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Driver View
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <AdminNav role={role} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
