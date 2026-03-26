import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md flex flex-col items-center animate-fade-up">
        {/* Logo mark */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
          <span className="text-white font-bold font-syne text-xl tracking-tight">FM</span>
        </div>

        {/* Wordmark */}
        <h1 className="text-4xl font-extrabold font-syne tracking-tight mb-1 leading-none text-balance text-center">
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Fleet
          </span>
          <span className="text-foreground ml-2">Manager</span>
        </h1>

        <p className="text-muted-foreground mt-3 mb-10 text-center max-w-sm text-sm leading-relaxed">
          Manage your family fleet of vehicles, maintenance records, receipts, and more.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-medium text-sm text-white cursor-pointer transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-ring"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-2.5 border border-border rounded-xl font-medium text-sm text-foreground bg-card hover:bg-accent cursor-pointer transition-colors duration-200 focus-ring"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
