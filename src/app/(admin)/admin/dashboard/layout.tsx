export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-[min(100%,32rem)]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 aurora"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
