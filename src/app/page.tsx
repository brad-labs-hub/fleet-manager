import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">

      {/* Logo mark */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
        <span className="text-white font-bold text-xl tracking-tight">FM</span>
      </div>

      {/* Wordmark */}
      <h1 className="text-4xl font-extrabold tracking-tight mb-1 leading-none">
        <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Fleet
        </span>
        <span className="text-foreground ml-2">Manager</span>
      </h1>

      <p className="text-muted-foreground mt-3 mb-10 text-center max-w-sm text-sm leading-relaxed">
        Manage your family fleet of vehicles, maintenance records, receipts, and more.
      </p>

      <div className="flex gap-3">
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }}
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="px-6 py-2.5 border border-border rounded-xl font-medium text-sm text-foreground hover:bg-accent transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
