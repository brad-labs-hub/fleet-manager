export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Car, Receipt, Wrench, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DriverLayout({
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
  const isAdmin = profile?.role === "controller" || profile?.role === "employee";

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link
            href="/driver/dashboard"
            className="flex items-center gap-2.5 cursor-pointer rounded-xl outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-emerald-sm shrink-0">
              <span className="text-white text-[10px] font-bold tracking-wide">FM</span>
            </div>
            <span className="font-semibold text-foreground text-sm">Fleet Manager</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer rounded-lg px-1 -mx-1 py-0.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </Link>
            )}
            <ThemeToggle />
            <form action={signOut}>
            <button
              type="submit"
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
          </div>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-pb z-10 md:relative md:border-0">
        <div className="flex justify-around py-2 md:flex md:gap-4 md:px-4 md:py-3 md:max-w-4xl md:mx-auto">
          <Link
            href="/driver/dashboard"
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground md:flex-row md:gap-2 cursor-pointer rounded-xl px-2 py-1 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Car className="h-5 w-5" />
            <span className="text-xs md:text-sm">Dashboard</span>
          </Link>
          <Link
            href="/driver/vehicles"
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground md:flex-row md:gap-2 cursor-pointer rounded-xl px-2 py-1 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Car className="h-5 w-5" />
            <span className="text-xs md:text-sm">Vehicles</span>
          </Link>
          <Link
            href="/driver/receipts"
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground md:flex-row md:gap-2 cursor-pointer rounded-xl px-2 py-1 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Receipt className="h-5 w-5" />
            <span className="text-xs md:text-sm">Receipts</span>
          </Link>
          <Link
            href="/driver/requests"
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground md:flex-row md:gap-2 cursor-pointer rounded-xl px-2 py-1 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Wrench className="h-5 w-5" />
            <span className="text-xs md:text-sm">Requests</span>
          </Link>
        </div>
      </nav>
      <main className="pb-20 md:pb-8 max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
