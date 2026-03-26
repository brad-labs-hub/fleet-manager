export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-[min(100%,32rem)]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-40 -left-32 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.16)_0%,transparent_68%)] dark:bg-[radial-gradient(circle,rgba(99,102,241,0.22)_0%,transparent_68%)]" />
        <div className="absolute top-1/3 -right-24 h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.1)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(124,58,237,0.16)_0%,transparent_70%)]" />
        <div className="absolute -bottom-32 left-1/3 h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_72%)]" />
        <div
          className="absolute inset-0 opacity-[0.5] dark:opacity-[0.35] [background-image:radial-gradient(circle_at_center,rgba(15,15,26,0.06)_1px,transparent_1px)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_center,rgba(248,250,252,0.055)_1px,transparent_1px)]"
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
